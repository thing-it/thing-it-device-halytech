# thing-it-device-halytech

[![NPM](https://nodei.co/npm/thing-it-device-halytech.png)](https://nodei.co/npm/thing-it-device-halytech/)
[![NPM](https://nodei.co/npm-dl/thing-it-device-halytech.png)](https://nodei.co/npm/thing-it-device-halytech/)

Device Plugins for halytech smart monitoring system for [[thing-it-node]](https://github.com/marcgille/thing-it-node) and [thing-it.com](wwww.thing-it.com).

## Configuration

Simply configure the following parameters via [thing-it] Mobile or [thing-it.com](wwww.thing-it.com).
* Name: Name for this halytech device.
* Type: The type of this halytech device.
* Server: Email server to pull emails from.
* User: User name on that email server.
* Password: Password on that email server.
* Subject: The subject of the email sent by halytech, the default is "Automatic Report".
* Location ID: The part of the filename that describes the location. The full file name is LOCATION_DATE with date in yyyymmdd format.
* Time Zone: The time zone for the timestamps in the provided file.
* Interval: Email pulling time in minutes.

## User Interface


## Where to go from here ...

After completing the above, you may be interested in

* Connecting additional [Devices](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/deviceConfiguration) and configuring
[Groups](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/groupConfiguration), 
[Services](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/serviceConfiguration), 
[Event Processing](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/eventConfiguration), 
[Storyboards](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/storyboardConfiguration) and 
[Jobs](https://www.thing-it.com/thing-it/#/documentationPanel/mobileClient/jobConfiguration) via your **[thing-it] Mobile App**.
* Use [thing-it.com](https://www.thing-it.com) to safely connect your Node Box from everywhere, manage complex configurations, store and analyze historical data 
and offer your configurations to others on the **[thing-it] Mesh Market**.
* Explore other Device Plugins like [Texas Instruments Sensor Tag](https://www.npmjs.com/package/thing-it-device-ti-sensortag), [Philips Hue Lighting](https://www.npmjs.com/package/thing-it-device-philips-hue) and many more. For a full set of 
Device Plugins search for **thing-it-device** on [npm](https://www.npmjs.com/). Or [write your own Plugins](https://github.com/marcgille/thing-it-node/wiki/Plugin-Development-Concepts).