---
layout: post
title:  "OpenPics In Swift: Part 1"
date:   2015-06-16 22:25:12
---

![openpics](/assets/openpics/openpics_icon.png)

[OpenPics](https://github.com/pj4533/OpenPics) is an open source iOS application for viewing images from multiple remote sources. I am finally starting the process of rewriting it in Swift.  During the process you can follow along at my new [repo](https://github.com/pj4533/OpenPicsSwift), mock me in the pull requests, send encouraging issues, etc.

This will be a complete rewrite, focusing on making the application simpler and easier to update as changes happen to iOS.  Currently, the biggest issue I have is all the special case code I use regarding the UICollectionView classes, specifically layout to layout transitions.  There is already a radar regarding auto layout constraints and layout to layout transitions.  If I want to support multitasking on iPad, I need size classes, if I need size classes, I need auto layout.  Perhaps it isn't quite that simple, but to hear Apple talk, it should just work!  Unfortunately, not much happening on that Radar since WWDC 2014...so I have decided to move on.  

![openpics1](/assets/openpics/openpics_part1.gif)

For now, I am going to use two separate UICollectionViewControllers, one for image thumbnails and one for full size images.  (Perhaps I will eventually add a custom transition).  This isn't ideal, but it will have to do for now. The Swift code for the thumbnail is simple. I set the item size based on the width of the frame.  However, this has the unfortunate side effect of not adjusting on rotation, so I'll need to handle that later.

{% highlight swift linenos %}
override func viewDidLoad() {
    super.viewDidLoad()

    self.collectionView!.dataSource = dataSource
    let layout = self.collectionViewLayout as! UICollectionViewFlowLayout
    
    let itemSize = (self.view.frame.width - 6) / 4
    layout.itemSize = CGSizeMake(itemSize, itemSize)
}
{% endhighlight %}

Also, you will notice that I abstracted the UICollectionViewDataSource.  Currently the project is very simple, but separating out your data sources is the easiest way to avoid view controller bloat.  The earlier the better.  The [Lighter View Controllers](http://www.objc.io/issues/1-view-controllers/lighter-view-controllers/) article at Objc.io is a great tutorial on abstracting data sources.

However, currently, my abstracted data source is mostly just placeholder code.

{% highlight swift linenos %}
class ImageDataSource: NSObject, UICollectionViewDataSource {
    func numberOfSectionsInCollectionView(collectionView: UICollectionView) -> Int {
        return 1
    }
    
    func collectionView(collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return 8
    }
    
    func collectionView(collectionView: UICollectionView, cellForItemAtIndexPath indexPath: NSIndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCellWithReuseIdentifier("Cell", forIndexPath: indexPath) as! ImageCollectionViewCell
        
        // Configure the cell
        cell.imageView.contentMode = .ScaleAspectFit
        cell.imageView.image = UIImage(named: "photo\(indexPath.item)")
        
        return cell
    }
}
{% endhighlight %}

More interesting things are happening in the full screen collection view controller.  I found a [good tutorial](http://adoptioncurve.net/archives/2013/04/creating-a-paged-photo-gallery-with-a-uicollectionview/) on UICollectionViewController and photo viewers.  However, it is a few years old now and I think some of the rotation code is a bit out of date.

Further I was really struggling with the item size for this controller.  As you can see in this code, I had to subtract off the content inset to avoid an error from Xcode.  Not sure what that is about.

{% highlight swift linenos %}
func collectionView(collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAtIndexPath indexPath: NSIndexPath) -> CGSize {
    let layout = self.collectionView!.collectionViewLayout as! UICollectionViewFlowLayout
    return CGSizeMake(self.collectionView!.frame.size.width, self.collectionView!.frame.size.height - self.collectionView!.contentInset.top) 
}
{% endhighlight %}

Finally, as you can see in the animation above, it jumps to the selected index path after becoming visible.

{% highlight swift linenos %}
override func viewDidAppear(animated: Bool) {
    self.collectionView!.scrollToItemAtIndexPath(self.currentIndexPath, atScrollPosition: UICollectionViewScrollPosition.CenteredHorizontally, animated: false)
}
{% endhighlight %}

Obviously, this is not ideal.

But these are issues for another day.  Check out the [repo](https://github.com/pj4533/OpenPicsSwift), and stay tuned for Part 2!