module.exports = {
    metadata: {
        family: "dataLogger",
        plugin: "dataLogger",
        label: "halytech Data Logger",
        manufacturer: "halytech",
        tangible: true,
        discoverable: false,
        state: [{
            id: "externalPowerVoltage",
            label: "External Power Voltage",
            type: {id: "decimal"}
        }, {
            id: "batteryOneVoltage",
            label: "Battery 1 Voltage",
            type: {id: "decimal"}
        }, {
            id: "batteryTwoVoltage",
            label: "Battery 2 Voltage",
            type: {id: "decimal"}
        }, {
            id: "temperature",
            label: "Form",
            type: {id: "decimal"}
        }, {
            id: "timestamp",
            label: "Timestamp",
            type: {id: "decimal"}
        }],
        configuration: [{
            id: "name",
            label: "Name",
            type: {id: "string"}
        }, {
            id: "type",
            label: "Type",
            type: {id: "string"}
        }, {
            id: "server",
            label: "Server",
            type: {id: "string"}
        }, {
            id: "username",
            label: "User Name",
            type: {id: "string"}
        }, {
            id: "password",
            label: "Password",
            type: {id: "string"}
        }, {
            id: "subject",
            label: "Subject",
            type: {id: "string"}
        }, {
            id: "locationID",
            label: "Location ID",
            type: {id: "string"}
        }, {
            id: "timeZone",
            label: "Time Zone",
            type: {id: "string"}
        }, {}, {
            id: "interval",
            label: "Interval",
            type: {id: "integer"}
        }],
        actorTypes: [],
        sensorTypes: [],
        services: []
    },
    create: function () {
        return new DataLogger();
    },
    discovery: function (options) {
        var discovery = new DataLoggerDiscovery();

        discovery.options = options;

        return discovery;
    }
};

var q = require('q');
var csv;
var xml2js;
var request;
var https;
var sensorLibrary;

function DataLoggerDiscovery() {

    DataLoggerDiscovery.prototype.start = function () {
    };

    DataLoggerDiscovery.prototype.stop = function () {
    };
}
/**
 *
 */
function DataLogger() {
    /**
     *
     */
    DataLogger.prototype.start = function () {
        var promise;

        this.logDebug("Starting halytech data logger.");

        if ((this.configuration.interval > 1) && (this.configuration.interval < 360)) {
            this.logDebug("Applying interval of " + this.configuration.interval + " minutes as configured.");
        } else {
            this.logDebug("Configured interval of " + this.configuration.interval + " minutes is out of range; changing " +
                "to 15 minutes.");
            this.configuration.interval = 15;
        }

        this.intervals = [];
        this.simulationIntervals = [];
        this.state = {};

        if (this.isSimulated()) {
            promise = q();
        } else {
            promise = this.pollData();
        }

        return promise;
    };


    DataLogger.prototype.pollData = function () {
        try {
            var promise = this.pollEmail(this.configuration.name)
                .then(function (csvData) {
                    return this.readCSVData(csvData);
                }.bind(this))
                .done(function (data) {
                    var actors = {};
                    var line;
                    var ownStateChanges = [];
                    var lastOwnStateChange = null;
                    var currentTimestamp;
                    var currentReading;

                    for (var n in this.actors) {
                        actors[this.actors[n].configuration.channel] = this.actors[n];
                    }

                    for (var n in data) {
                        line = data[n];
                        currentTimestamp = new Date(line[1]);
                        currentReading = parseFloat(line[2]);

                        try {
                            //TODO create one generic method that updates lastOwnStateChange instead of the spaghetti below
                            switch (line[0]) {
                                case "External Power Vol_reading":
                                    if (!lastOwnStateChange) {
                                        lastOwnStateChange = this.initHistoricState(currentTimestamp);
                                    }

                                    if (currentTimestamp.getTime() == lastOwnStateChange.timestamp.getTime()) {
                                        lastOwnStateChange.state.externalPowerVoltage = currentReading;
                                    } else {
                                        ownStateChanges.push(lastOwnStateChange);
                                        lastOwnStateChange = this.initHistoricState(currentTimestamp);
                                        lastOwnStateChange.externalPowerVoltage = currentReading;
                                    }

                                    break;

                                case "Battery 1 Voltage_reading":
                                    if (!lastOwnStateChange) {
                                        lastOwnStateChange = this.initHistoricState(currentTimestamp);
                                    }

                                    if (currentTimestamp.getTime() == lastOwnStateChange.timestamp.getTime()) {
                                        lastOwnStateChange.state.batteryOneVoltage = currentReading;
                                    } else {
                                        if (lastOwnStateChange) {
                                            ownStateChanges.push(lastOwnStateChange);
                                        }

                                        lastOwnStateChange = this.initHistoricState(currentTimestamp);
                                        lastOwnStateChange.batteryOneVoltage = currentReading;
                                    }
                                    break;

                                case "Battery 2 Voltage_reading":
                                    if (!lastOwnStateChange) {
                                        lastOwnStateChange = this.initHistoricState(currentTimestamp);
                                    }

                                    if (currentTimestamp.getTime() == lastOwnStateChange.timestamp.getTime()) {
                                        lastOwnStateChange.state.batteryTwoVoltage = currentReading;
                                    } else {
                                        if (lastOwnStateChange) {
                                            ownStateChanges.push(lastOwnStateChange);
                                        }

                                        lastOwnStateChange = this.initHistoricState(currentTimestamp);
                                        lastOwnStateChange.batteryTwoVoltage = currentReading;
                                    }
                                    break;

                                case "System Temp_reading":
                                    if (!lastOwnStateChange) {
                                        lastOwnStateChange = this.initHistoricState(currentTimestamp);
                                    }

                                    if (currentTimestamp.getTime() == lastOwnStateChange.timestamp.getTime()) {
                                        lastOwnStateChange.state.temperature = currentReading;
                                    } else {
                                        if (lastOwnStateChange) {
                                            ownStateChanges.push(lastOwnStateChange);
                                        }

                                        lastOwnStateChange = this.initHistoricState(currentTimestamp);
                                        lastOwnStateChange.temperature = currentReading;
                                    }
                                    break;

                                default:
                                    var readingPos = line[0].indexOf("_reading");
                                    var cumulatedReading = (readingPos > -1);

                                    if (cumulatedReading) {
                                        channelId = line[0].substr(0, readingPos);
                                    } else {
                                        channelId = line[0];
                                    }

                                    var actor = actors[channelId];

                                    if (actor) {
                                        if (cumulatedReading) {
                                            actor.addCumulatedReading({
                                                id: channelId,
                                                timestamp: currentTimestamp,
                                                cumulatedReading: currentReading
                                            });
                                        } else {
                                            actor.addReading({
                                                id: channelId,
                                                timestamp: currentTimestamp,
                                                reading: currentReading
                                            });
                                        }
                                    } else {
                                        this.logError("Channel " + channelId + " not configured, ignoring data.");
                                    }

                                    break;
                            }
                        } catch (e) {
                            this.logError("Error reading csv data.", e);
                        }
                    }

                    for (var n in this.actors) {
                        this.actors[n].publishReadings();
                    }


                    if (lastOwnStateChange) {
                        ownStateChanges.push(lastOwnStateChange);
                        this.state = lastOwnStateChange;
                    }

                    this.publishStateChangeHistory(ownStateChanges);
                    this.publishStateChange();
                    return q();
                }.bind(this));
        } catch (e) {
            this.logError(e);
            promise = q();
        }

        return promise;
    };

    DataLogger.prototype.initHistoricState = function (timestamp) {
        return {
            timestamp: timestamp,
            state: {
                externalPowerVoltage: 0,
                batteryOneVoltage: 0,
                batteryTwoVoltage: 0,
                temperature: 0
            }
        };
    };

    /**
     *
     */
    DataLogger.prototype.stop = function () {
        for (var interval in this.intervals) {
            clearInterval(interval);
        }

        for (var interval in this.simulationIntervals) {
            clearInterval(interval);
        }
    };

    DataLogger.prototype.pollEmail = function (name) {
        this.logDebug("Polling email for unit  " + name);

        //TODO implement and make sure multiple emails would get picked up.
        return q('ETGD0018,5-Dec-16 23:30:00,0.000\n' +
            'ETGD0018,5-Dec-16 23:35:00,0.000\n' +
            'ETGD0018,5-Dec-16 23:40:00,1.000\n' +
            'ETGD0018,5-Dec-16 23:45:00,0.000\n' +
            'ETGD0018,5-Dec-16 23:50:00,0.045\n' +
            'ETGD0018,5-Dec-16 23:55:00,2.100\n' +
            'ETGD0018,6-Dec-16 0:00:00,3.002\n' +
            'ETGD0018_reading,6-Dec-16 0:00:00,2825.000\n' +
            'External Power Vol_reading,6-Dec-16 0:00:00,0.019\n' +
            'Battery 1 Voltage_reading,6-Dec-16 0:00:00,7.324\n' +
            'Battery 2 Voltage_reading,6-Dec-16 0:00:00,6.640\n' +
            'System Temp_reading,6-Dec-16 0:00:00,23.000\n' +
            'ETGD0018,6-Dec-16 0:05:00,0.400\n' +
            'ETGD0018,6-Dec-16 0:10:00,1.123\n' +
            'ETGD0018,6-Dec-16 0:15:00,0.980\n' +
            'ETGD0018,6-Dec-16 0:20:00,0.021\n' +
            'ETGD0018,6-Dec-16 0:25:00,0.000\n' +
            'ETGD0018,6-Dec-16 0:30:00,0.000\n' +
            'ETGD0018,6-Dec-16 0:35:00,2.500\n' +
            'ETGD0018,6-Dec-16 0:40:00,0.000\n' +
            'ETGD0018,6-Dec-16 0:45:00,0.000\n' +
            'ETGD0018,6-Dec-16 0:50:00,0.000');
    };

    DataLogger.prototype.readCSVData = function (csvData) {
        var deferred = q.defer();

        if (!csv) {
            csv = require('csv');
        }

        csv.parse(csvData, function (err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(data);
            }
        }.bind(this));

        return deferred.promise;
    };


    /**
     *
     */
    DataLogger.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     *
     */
    DataLogger.prototype.getState = function () {
        return this.state;
    };
}
