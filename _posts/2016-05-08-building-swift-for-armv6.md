---
layout: post
title:  "Building Swift For ARMv6"
date:   2016-05-08 18:39:10
---

# Building Swift For ARMv6

Back in March I wrote about [using Swift](http://saygoodnight.com/2016/03/28/ipadpro-swift-raspberrypi.html) on my Raspberry Pi Model B (an ARMv6 device).  I was using the swift 3.0 binary that @uraimo built and shared from [here](https://www.uraimo.com/2016/03/10/swift-3-available-on-armv6-raspberry-1-zero/).  

Since then, a group of people came together via a Slack chat to help the 'Swift for ARM' processor effort, details [here](http://dev.iachieved.it/iachievedit/swift-for-arm-systems/).  I joined and didn't know how to start contributing so, I figured a good way to learn was to build Swift myself.  I only have an ARMv6 Pi, so I started there.  @uraimo mentions in his blog post, '100s of hours of compiling...', but I knew I could just leave it compiling on my desk, and go about my normal business.  This way we can get newer binaries for ARMv6 (Pi1 or PiZero), while we wait for cross-compiling to get finished.  Also, by documenting the steps I took, maybe I'll make it easier for someone else to get started in the Swift for ARM world.

## Setup
I started by installing [Raspbian Lite](https://www.raspberrypi.org/downloads/raspbian/) using a brand new 32gb SD card.  This way I could keep my daily Raspbian image, while having a special 'dev' card for Swift builds.   Details for getting Raspbian and imaging (from OSX) are [here](https://www.raspberrypi.org/downloads/raspbian/) and [here](https://www.raspberrypi.org/documentation/installation/installing-images/mac.md).

I run everything headless, so after getting a bootable image on the card, I connected via ethernet to setup wifi.  Easiest way to find the IP:  `arp -na | grep -i b8:27:eb`   Once on the Pi, I move my public SSH key to the `authorized_keys` file on the Pi, so I can SSH in easily.  Details [here](http://www.linuxproblem.org/art_9.html) on that.

Also don't forget to expand the file system using `sudo raspi-config`, so you get full use of the 32gb card.

Then I setup wifi, [here](https://www.raspberrypi.org/documentation/configuration/wireless/wireless-cli.md) is a good link on that.

## Software Updates

With the Pi setup, its time to get the proper tools.  First update packages:

`sudo apt-get update`

Install general dependencies needed for building Swift:

`sudo apt-get install git cmake ninja-build clang python uuid-dev libicu-dev icu-devtools libedit-dev libxml2-dev libsqlite3-dev swig libpython-dev libncurses5-dev pkg-config`

## Other Setup

I like using SSH with Github (others are fine with https), so if you like SSH, its probably best to make a new SSH key so you can reject it from your account (should something go wrong).  Details for making and installing a new SSH key are [here](https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/).  

One of the best posts about building Swift for Pi's comes from [MoriMori](http://morimori.tokyo/2016/01/05/how-to-compile-swift-on-a-raspberry-pi-2/), be sure to see the updated post [here](http://morimori.tokyo/2016/02/09/compiling-swift-on-a-raspberry-pi-2-february-2016-update-and-a-script-to-clone-and-build-open-source-swift/).  Some tips I picked up from that blog post:

* Make a big swap file
	* `sudo vi /etc/dphys-swapfile`
	* Change `CONF_SWAPSIZE` to 2048 and reboot 

* Install `screen` in case your connection stalls:
	* `sudo apt-get install screen`
	* Start a new screen: `screen -S buildswift`
	* Reattach to screen: `screen -r buildswift`
	* List current screens: `screen -ls`

* Install `htop` for monitoring cpu/memory during build
	* `sudo apt-get install htop`

## Relax

Ok, now the system is setup, next we need to dig into the code.  The Swift build process was extremely overwhelming to me at first.  The important piece to understand is in the main Swift repo, the `build_script` file.  This file is the center of building Swift.  There are various tools for helping to clone code & updating code, but I think [these lines](https://github.com/apple/swift/blob/master/utils/build-script#L205-L216) in `build_script` are key to understand:

```
'build-script' expects the sources to be laid out in the following way:
   $SWIFT_SOURCE_ROOT/llvm
                     /clang
                     /swift
                     /lldb                       (optional)
                     /llbuild                    (optional)
                     /swiftpm                    (optional, requires llbuild)
                     /compiler-rt                (optional)
                     /swift-corelibs-xctest      (optional)
                     /swift-corelibs-foundation  (optional)
                     /swift-corelibs-libdispatch (optional)
```                     

This comment shows you:

* how to lay out the various repos
* that basically everything (barring llvm, clang & swift) are *OPTIONAL*

Once you realize that, it simplifies things a bit. While `build_script` has a ton of switches and is very complex, you _can_ get a build going by doing a simple: `./swift/utils/build-script`

I urge anyone interested to spend some time reading the comments in `build_script`, it really de-mystifies the whole process.

## The Clone Army

To actually get the code, you can clone the repos yourself or you can use a script.  As we saw above, it is important to lay out the directories as `build_script` wants them.  I initially cloned the repos myself, so I would understand everything:

* `git clone git@github.com:apple/swift.git swift`
* `git clone git@github.com:hpux735/swift-llvm.git llvm`
* `git clone git@github.com:apple/swift-clang.git clang`
* `git clone git@github.com:apple/swift-lldb.git lldb`
* `git clone git@github.com:apple/swift-cmark.git cmark`
* `git clone git@github.com:apple/swift-llbuild.git llbuild`
* `git clone git@github.com:apple/swift-package-manager.git swiftpm`
* `git clone git@github.com:apple/swift-corelibs-xctest.git`
* `git clone git@github.com:apple/swift-corelibs-foundation.git`
* `git clone git@github.com:apple/swift-corelibs-libdispatch.git`
* `git clone git@github.com:apple/swift-compiler-rt.git`

Note that the LLVM is from @hpux735.  He did a bunch of work to support ARM processors, and for ARM work its best to build on that.

However, I quickly tired of manually cloning and updating the repos, so I started using a set of scripts from @iachievedit for building & packaging Swift, the repo is [here](https://github.com/iachievedit/package-swift).   To use this, simply clone it and run `./get.sh`.  This will clone the proper repos for you.  Also included are scripts for updating and cleaning.

One interesting note:  I initially screwed up and used the master branch of LLVM, not @hpux735's.  After days of compiling, it actually worked, but only `swiftc` not `swift`, details on the difference of those (symlinked) tools are [here](http://owensd.io/blog/swift-vs-swiftc/)

## Start The Build
With a fresh clone, as updated as possible, its time to kick off the build.   Here is the exact command I used:

```
swift/utils/build-script -R -- \
--install-swift \
--install-foundation \
--install-prefix=/usr \
--foundation \
--install-destdir="/tmp/swift" \
'--swift-install-components=autolink-driver;compiler;clang-builtin-headers;stdlib;sdk-overlay;license' \
--reconfigure
```

These switches look scary, but most of them are just about the install/packaging step.  This build will attempt to build `Foundation`, and install Swift and Foundation in `/tmp/swift`, which makes it easy to compress the results for sharing!

So kick that off, and relax, because on an ARMv6 it will probably take ~3 days.  

## Gotchas

### SR-623
The first issue I ran into when using `swiftc` was [this](https://bugs.swift.org/browse/SR-623) bug.  It might be due to not using @hpux735's LLVM though (currently building with that right now).  Either way, it was solvable by adding `-target armv6-unknown-linux-gnueabihf` to the build like this:

`./bin/swiftc -target armv6-unknown-linux-gnueabihf helloworld.swift`

### Foundation
@hpux735 also did a bunch of work to get Foundation working on ARMv7, so I submitted a pull request to extend that work to include ARMv6, [here](https://github.com/apple/swift-corelibs-foundation/pull/352)

### SR-1412
I ran into heavy problems with `va_list` discussed in [this](https://bugs.swift.org/browse/SR-1412) bug.  A workaround patch is listed, which involves adding a switch to the Foundation build: `-Xcc -D_VA_LIST`  This allows the build to finish, but I found I had to also add that switch to any `swiftc` compiles also, so now the line looks like:

`./bin/swiftc -target armv6-unknown-linux-gnueabihf -Xcc -D_VA_LIST helloworld.swift` 

## The Result

Since it takes a loooong time, I recommend backups...I foolishly screwed up one SD card by trying to install clang 3.6 for a different architecture. [Here](https://www.raspberrypi.org/documentation/linux/filesystem/backup.md) is a good link for making a complete image of the card. 

And if you just want the goods, [here](https://www.dropbox.com/s/z8fuoonlrha5lrj/swift__05042016.tar.gz?dl=0) is a tar of my most recent build for ARMv6 (with the above caveats).