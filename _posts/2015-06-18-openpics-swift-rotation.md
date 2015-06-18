---
layout: post
title:  "OpenPics In Swift: Rotational Issues"
date:   2015-06-18 17:19:10
---

![openpics](/assets/openpics/openpics_icon.png)

# Updates

I decided to go back and give layout to layout transitions one more shot.  I didn't like how much extra code I was needing, just to offset the collection view items between controllers.  Layout to Layout was _meant_ to handle this exact case.  So anyway, here is an example of the annoying autolayout constraint animation bug.

![layout_to_layout](/assets/openpics/layout_to_layout_bug.gif)

Here I have made the cell background red.  Notice how when I start the interactive transition back, the size of the cells interactively get smaller as the transition occurs.  However, the image view (held in place by autolayout constraints) snaps to its final position right away.  Perhaps I can address that later, or maybe it will get fixed by Apple?

Up next, I made the quick fix for handling thumbnail item size on rotation.  It was really easy:

{% highlight swift linenos %}
override func willRotateToInterfaceOrientation(toInterfaceOrientation: UIInterfaceOrientation, duration: NSTimeInterval) {
    self.collectionView!.collectionViewLayout.invalidateLayout()
}

func collectionView(collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAtIndexPath indexPath: NSIndexPath) -> CGSize {
    // Force 4 items across, regardless of width
    let itemSize = (self.collectionView!.frame.width - 6) / 4
    return CGSizeMake(itemSize, itemSize)
}
{% endhighlight %}

Similarly, I wanted to use dynamic item sizing in the full screen collection view controller.  However, using layout to layout transitions means that the delegate and datasource is always handled by the root view controller.  There is a good discussion of this on [Objc.io](http://www.objc.io/issues/12-animations/collectionview-animations/).  So I follow their example and setup a UINavigationControllerDelegate.

{% highlight swift linenos %}
func navigationController(navigationController: UINavigationController, willShowViewController viewController: UIViewController, animated: Bool) {
    if let vc = viewController as? UICollectionViewController {
        vc.collectionView!.delegate = vc
    }
}
{% endhighlight %}

I don't really care whether I am coming or going, the delegate is always being set to itself, so I don't check for a specific class.  Then, inside the full screen collection view controller, I can set my item size dynamically.

{% highlight swift linenos %}
func collectionView(collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAtIndexPath indexPath: NSIndexPath) -> CGSize {
    return CGSizeMake(self.collectionView!.frame.size.width, self.collectionView!.frame.size.height * 0.8)
}
{% endhighlight %}

I was still having that weird issue with insets.  It didn't like me setting the size of the item to be very big, but when I made it smaller, it was offset weird from the top.  So I decided to punt, and just make the height always 80% of the view height.  That way I don't have to do any math involving insets.  Its a hack...

# The Rotation-ing

This leads us to the major portion of this installment, figuring out rotation.  Following the [tutorial](http://adoptioncurve.net/archives/2013/04/creating-a-paged-photo-gallery-with-a-uicollectionview/) from last time, I got it mostly working, but I was never 100% happy with it.  I didn't like doing all that contentOffset math, just to figure out the index.  So I modified the technique to just get the visible index path, and cache that.  Otherwise, it is the same (using the fade animation).  Although, I do get a bit of flashing on the simulator, might need to reevaluate this in the future.

{% highlight swift linenos %}
override func willRotateToInterfaceOrientation(toInterfaceOrientation: UIInterfaceOrientation, duration: NSTimeInterval) {
    self.collectionView!.alpha = 0.0

    self.visibleIndexPath = self.collectionView!.indexPathsForVisibleItems().first!
    self.collectionView!.collectionViewLayout.invalidateLayout()
}

override func didRotateFromInterfaceOrientation(fromInterfaceOrientation: UIInterfaceOrientation) {
    self.collectionView!.scrollToItemAtIndexPath(self.visibleIndexPath, atScrollPosition: UICollectionViewScrollPosition.CenteredHorizontally, animated: false)
    
    UIView.animateWithDuration(0.125) { () -> Void in
        self.collectionView!.alpha = 1.0
    }
}
{% endhighlight %}

Now, we are doing fairly good.  Rotation works, transitions work.  However, I noticed a very annoying bug.  If you start in portrait, tap into a cell to view a photo, then rotate to landscape, **then** when you go back, the view still thinks it is portrait.

![rotate_bug](/assets/openpics/rotate_bug.gif)


How do I fix this programmatically?

I did some searching and found this [stack overflow](http://stackoverflow.com/questions/26890204/ios8-after-pushing-a-uiviewcontroller-on-a-uinavigationcontroller-and-rotating), which seemed to be exactly this issue.  However, I found that the issue still happened when I implemented the suggested fix.  By putting debugging statements in viewDidAppear, it seems the view size was still pre-rotation, even though viewWillTransitionToSize had the correct size (and passed to super).  I was able to fix the issue by manually setting the view frame, but only in the case when we aren't currently visible.

{% highlight swift linenos %}
if self.navigationController?.visibleViewController != self {
    self.view.frame = CGRectMake(self.view.frame.origin.x, self.view.frame.origin.y, size.width, size.height)
}
{% endhighlight %}

This does the trick.  Seems like a bug in Apples code perhaps?