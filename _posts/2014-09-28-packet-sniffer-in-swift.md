---
layout: post
title:  "Writing a packet sniffer in swift"
date:   2014-09-28 15:59:12
---

![eye](/assets/wifi_eye.png)

'wat' is a very simple exploration of using the libpcap library on OSX via Swift through a command line interface.  This is the first code I wrote using swift, so it has been a learning experience!

[https://github.com/pj4533/wat](https://github.com/pj4533/wat)

## Running
Just load in XCode6+, and build.   Then run with sudo:

	sudo ./wat

Initial output should look like this:

	Opening device: en0
	Datalink Name: IEEE802_11_RADIO
	Datalink Description: 802.11 plus radiotap header


Hardcoded to en0 for now.

Also, I am focusing on the output of management and authentication packets (EAPOL), since the first task is getting the 4-way handshake supported for decrypting WPA2 traffic. (More details in the 'gotchas' section [here](http://wiki.wireshark.org/HowToDecrypt802.11).)


### Function pointers in Swift
When I originally wrote this I was using XCode6 beta 4, and at the time had to go back to Objective C to do the function pointers that libpcap requires.  I am unsure if this is still needed in the shipping version.


### Low level byte manipulation
Found this code on [Stack Overflow](http://stackoverflow.com/questions/24067085/pointers-pointer-arithmetic-and-raw-data-in-swift) - very useful for low level byte manipulation in Swift:

{% gist 770ef91262b8ee868265 %}
