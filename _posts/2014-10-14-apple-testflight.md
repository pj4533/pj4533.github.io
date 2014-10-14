---
layout: post
title:  "Thoughts On Apple's TestFlight"
date:   2014-10-14 12:30:12
---

![evertrue_icon](/assets/evertrue_icon.jpg)

Used Apple's new TestFlight service for the first time last night.  Thought I would share my experience.   I have used several of these types of services in the past (including the original TestFlight, pre-Apple).   Currently, I use HockeyApp.  

Currently there are quite a few features that TestFlight doesn't have, and features that are difficult to use.   However, I believe Apple's service will win in the long run, and HockeyApp (and similar services) are in trouble.  For a simple reason:  one binary.   When I use Apple's TestFlight it is the same exact set of bits that are being beta tested, as are being pushed the App Store.   I don't have to manage different certificates (for an internal Enterprise account), or even different provisioning profiles.   I can just promote "good" builds to the App Store once they pass a Beta period with from internal testers.  It will be interesting to see if Apple can maintain this "build once" mechanism after they enable support for 1000 'external' testers.   (Announced at WWDC).

While having a single binary is the key feature for me, it also limits the usage.  Because the app ID is shared, a user cannot have a 'beta' build installed AND the app store build.  (Although the cute little orange dot denoting 'beta' is nice).   This is a key feature that I use with HockeyApp.  I generate multiple app ids, and manage them separately, so users get a different icon for beta builds & alpha builds.  It seems to me that Apple should be able to manage this internally, abstracted from the user and the developer.   (So I could get a Beta icon, and a app store icon)
