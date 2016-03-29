---
layout: post
title:  "Swift On Raspberry Pi From iPad Pro"
date:   2016-03-28 18:39:10
---

![rpi](/assets/rpi_logo.png)![swift](/assets/swift_logo.png)

Recently I dug out my old Raspberry Pi Model B (rev2) to try out open source Swift.  It had been a long time, I started from scratch.

# Basics

I re-imaged a fresh version of Raspbian Jesse Lite from [here](https://www.raspberrypi.org/downloads/raspbian/), following the OSX instructions [here](https://www.raspberrypi.org/documentation/installation/installing-images/mac.md).  It was a bit off, but if you are careful with the disk names, it works fine.

I don't have a wifi adapter (yet, on order), so I used ethernet & booted up the pi.  From my Mac, I used this command to find the Pi's ip address (from [here](http://raspberrypi.stackexchange.com/questions/13936/find-raspberry-pi-address-on-local-network)):

```
arp -na | grep -i b8:27:eb
```

With the proper address, I fired up [Prompt](https://panic.com/prompt/) and SSH'd using the default username and password (pi/raspberry).

# Swift

I dug around and found [@uraimo](http://twitter.com/uraimo) had done the work to get Swift up and running on ARMv6 (RaspberryPi1/Zero).  My first attempt was Swift 2.2 from [here](https://www.uraimo.com/2016/02/10/swift-available-on-armv6-raspberry-1-zero/), however that led to a compiler error...so then I tried his updated Swift 3.0 snapshot [here](https://www.uraimo.com/2016/03/10/swift-3-available-on-armv6-raspberry-1-zero/).  This worked perfect, and even includes [Foundation](https://github.com/apple/swift-corelibs-foundation).

# Editor

![coda](/assets/ipadpro_coda_swift.gif)

Now I was setup with a compiler.  I love a good terminal vi/nano/emacs as much as the next neckbeard, but using it for Swift development was not cutting it.  I looked around and Panic's other product [Coda](https://panic.com/coda/) supports Swift syntax highlighting, working remotely via SSH, and terminals in tabs!  Perfect!  I got that setup on my iPad Pro and now I have a nice environment to write Swift for the Raspberry Pi.

# Coding

I have a Raspberry Pi camera on order, so I know I am going to want to control that from Swift.  I couldn't find a Swift native library, like they have for [Python](https://github.com/waveform80/picamera).  However, with the [SwiftyGPIO](https://github.com/uraimo/SwiftyGPIO) project, it _should_ be possible, right?  For now, I will stick to using the command line tools like [raspistill](https://www.raspberrypi.org/documentation/usage/camera/raspicam/raspistill.md).

This means I'll need to be able to run shell commands from Swift.  Googling this leads to code that uses Foundation, and is some variation of this:

{% highlight swift linenos %}
func runCommand(path : String, args : [String]) -> (output: NSString, error: NSString, exitCode: Int32) {
    let task = NSTask()
    task.launchPath = path
    task.arguments = args

    let outpipe = NSPipe()
    task.standardOutput = outpipe
    let errpipe = NSPipe()
    task.standardError = errpipe

    task.launch()

    let outdata = outpipe.fileHandleForReading.readDataToEndOfFile()
    let output = NSString(data: outdata, encoding:  NSUTF8StringEncoding)

    let errdata = errpipe.fileHandleForReading.readDataToEndOfFile()
    let error_output = NSString(data: errdata, encoding: NSUTF8StringEncoding)

    task.waitUntilExit()
    let status = task.terminationStatus

    return (output!, error_output!, status)
}
{% endhighlight %}

So, we got `NSTask`, `NSPipe`, `NSString`...oh boy.

Looking at the Foundation [status page](https://github.com/apple/swift-corelibs-foundation/blob/master/Docs/Status.md), it _says_ `NSTask` isn't implemented yet, `NSPipe` isn't listed, and `NSString` is partially implemented.

I figured, what the heck, try it.  It compiles and runs!  And (sorta) works!  The issue is that it doesn't seem to ever _quit_.  I dug around in the source code a bit, and eventually just simplified my code to this:

{% highlight swift linenos %}
import Foundation

func shell(command: String) {
  // Create a Task instance
  let task = NSTask()

  // Set the task parameters
  task.launchPath = "/bin/bash"
  task.arguments = ["-c", command]

  // Launch the task
  task.launch()
  task.waitUntilExit()
}

shell("raspistill")
{% endhighlight %}

This runs the command, and exits properly.  I'm sure I'll run into other issues once I get the camera & wifi going, but for now my iPad Pro Raspberry Pi Swift dev kit is going good!
