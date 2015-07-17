---
layout: post
title:  "OpenPics In Swift: The UIScrollView"
---

One of the final, basic features of our OpenPics photo viewer is the ability to double-tap zoom into photos.  This is similar functionality as the Photos.app.  Unfortunately, it is deceptively difficult to get right.

At its core, this is a simple feature.  You place the UIImageView in a UIScrollView, and respond to the delegate method viewForZoomingInScrollView.

We will add the UIScrollView to our cells, and use autolayout to keep them the size of the cell.  This gives us a similar issue to the UIImageView, in that the contraints do not animate properly.  However, we have already decided this is ok for now.

Further, when we add the UIImageView to the UIScrollView, we cannot simply use autolayout to resize the UIImageView with the UIScrollView.  This issue is explained in this [technote](https://developer.apple.com/library/ios/technotes/tn2154/_index.html) from Apple.

Another issue is due to Layout to layout transitions.  While it makes it easy to transition, the UICollectionView is shared, and thus the cells are shared.  This is great, because we don't have to setup the cells again, however it is also difficult because we want to setup the cells _slightly_ different when we are in the full screen layout.  Most notably we need to turn off user interaction on the UIScrollView when in the thumbnail layout, so that the scroll view won't override the selection of the cell that triggers the transition.  Then, once we transition, we want to turn on user interaction for the UIScrollView, so the zooming works properly in the full screen layout.



https://developer.apple.com/library/ios/documentation/WindowsViews/Conceptual/UIScrollView_pg/ZoomZoom/ZoomZoom.html

https://github.com/StuartMorris0/SPMZoomableUIImageView



notes
-----

- looks like you need to manually do the zooming for the scrollview?
- maybe look at old openpics
