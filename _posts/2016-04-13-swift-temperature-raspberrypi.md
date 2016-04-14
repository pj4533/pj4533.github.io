---
layout: post
title:  "Temperature & Humidity Monitor in Swift on Raspberry Pi"
date:   2016-04-13 18:39:10
---

![dhtxx](/assets/dhtxx.jpg)

I finally finished another Raspberry Pi project, using Swift.  This time I hooked up an [AM2302](https://www.adafruit.com/products/393) (a wired up [DHT22](https://www.adafruit.com/products/385)) to my [HD44780](https://www.adafruit.com/products/1447) 16x2 LCD.

# The Problem

My main goal is to be able to monitor the temperature and humidity in our basement, where my vinyl record collection is stored.  (As a side, I'd love to have the skills to add temp/humidity monitoring to any garden projects I undertake later.)   

The DHTXX line of products _seems_ simple...I thought it would be a one night project.  Wiring it up was simple, but reading the data is where it gets difficult.  

# Pulses

First, there are a few libraries and code pieces out there ([Python & C](https://github.com/adafruit/Adafruit_Python_DHT) mostly), so it might help to start there.  I found this code to be difficult to follow, and figured I'd just keep hacking till I could make a Swift version.

The [datasheet](https://cdn-shop.adafruit.com/datasheets/Digital+humidity+and+temperature+sensor+AM2302.pdf) for the DHTXX boards describe how to read data -- essentially it sends 40 quick pulses.  Each pulse that is ~25 microseconds represents a `0`, and each pulse at ~70 microseconds represents a `1`.  So that is 16 bits of relative humidity, 16 bits of temperature and 8 bits of checksum (to verify everything is good).

The issue is that Linux, by default, is not realtime.  This means that at any time, our user-mode process might be interrupted by something that the kernel thinks is more important.  The timing required for measuring is so exact, you can easily miss one or more of those 20-70 microsecond pulses.  

What most code solutions do is bump up the priority of the process to the max (then only higher priority threads can interrupt us), and form a tight loop to try and measure the timings.  The Adafruit code above does some [weird stuff](https://github.com/adafruit/Adafruit_Python_DHT/blob/master/source/Raspberry_Pi/pi_dht_read.c#L88-L106) with using a counter to then try and decide how long a counter tick is in microseconds...and I didn't understand all that, so I just used `gettimeofday` and recorded the length of each pulse.  This made it obvious in my debugging code when a pulse was correct (roughly 25us or 70us), or when something was wrong.  Not the only solution, but it made sense to me.

```
LOW PULSE TIMINGS (41): [47, 52, 51, 52, 51, 52, 52, 51, 65, 52, 51, 51, 52, 51, 51, 52, 64, 52, 18, 53, 52, 51, 52, 51, 65, 51, 52, 51, 51, 52, 52, 52, 62, 52, 52, 52, 52, 51, 52, 52, 45, 0]
HIGH PULSE TIMINGS (41): [0, 24, 24, 25, 25, 25, 25, 24, 70, 24, 24, 72, 72, 71, 25, 71, 24, 24, 4, 24, 23, 25, 25, 25, 23, 72, 72, 24, 72, 24, 71, 72, 23, 24, 24, 23, 72, 25, 24, 25, 70, 0]
Computed checksum: 00010001(17) = (00000001(1) + 00111010(58) + 00000000(0) + 11010110(214)) & 0xFF
  Actual checksum: 00010001(17)
----------------------------------
temp: 70.52  hum: 31.4
```

# Code

The real core loop that I simplified:

{% highlight swift linenos %}
gettimeofday(&startTime,nil)
for _ in 0..<5000000 {
	if self.pin.value != prevValue {
    	gettimeofday(&endTime,nil)
    	let pulseTime = endTime.tv_usec - startTime.tv_usec
		if prevValue == 0 {
			lowPulseTimes[lowpulse] = pulseTime
			lowpulse = lowpulse + 1
		} else {
			highPulseTimes[highpulse] = pulseTime
			highpulse = highpulse + 1
		}
		prevValue = self.pin.value
		gettimeofday(&startTime,nil)
	}
}
{% endhighlight %}

I still don't like how it samples over an arbitrary length for-loop, rather than using a nice callback mechanism.  I know this is on the todo list for SwiftyGPIO, so maybe I'll have to attack that problem in the future.

I hooked up this in a while-loop that tells me the latest good temp/humidity values, and also the number of seconds since the last good reading.  That way, even if I don't get a good reading for a while, I can still see the most recent values on my LCD.  Usually I can get good readings in 30-45 seconds, sometimes much quicker.  

{% highlight swift linenos %}
gettimeofday(&startTime,nil)
while (true) {
	do {
		(temperature,humidity) = try dht.read(true)
	    gettimeofday(&startTime,nil)
		print("temp: \(temperature)  hum: \(humidity)")
	} catch (DHTError.InvalidNumberOfPulses) {
		let errorMessage = "INVALID PULSES"
		print(errorMessage)
	} catch (DHTError.InvalidChecksum) {
		let errorMessage = "INVALID CHECKSUM"
		print(errorMessage)
	}

	gettimeofday(&endTime,nil)

	lcd.clearScreen()
	lcd.cursorHome()
	lcd.printString(0,y:0,what:"Temp: \(temperature) \(endTime.tv_sec - startTime.tv_sec)s",usCharSet:true)
	lcd.printString(0,y:1,what:"Humidity: \(humidity)",usCharSet:true)	
	sleep(5)		
}
{% endhighlight %}


All my code for this project is available [here](https://github.com/pj4533/dhtxx).