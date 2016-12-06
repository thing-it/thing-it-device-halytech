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
            this.pollData();
        }

        /*      TODO update sensors
         this.intervals.push(setInterval(function () {
         pollEmail.call(this, this.configuration.host, this.configuration.mac, function (error, unitState) {
         this.updateSensors(unitState);
         }.bind(this))
         }.bind(this), this.configuration.interval));
         */

        return promise;
    };


    DataLogger.prototype.pollData = function () {
        var promise = this.pollEmail(this.configuration.name)
            .then(function (csvData) {
                return this.readCSVData(csvData);
            }.bind(this))
            .done(function (data) {
                for (var n in data) {
                    try {
                        this.readLine(data[n]);
//                            this.updateSensors(unitState);
                    } catch (e) {
                        this.logError("Error reading csv data.", e, unitState);
                    }
                }

                this.logDebug(this.state);
                return q();
            }.bind(this));

        return promise;
    };

    DataLogger.prototype.readLine = function (line) {
        var deferred = q.defer();
        var sensorId;

        switch (line[0]) {
            case "External Power Vol_reading":
                this.state.externalPowerVoltage = line[2];
                this.state.timestamp = line[1];
                break;
            case "Battery 1 Voltage_reading":
                this.state.batteryOneVoltage = line[2];
                this.state.timestamp = line[1];
                break;
            case "Battery 2 Voltage_reading":
                this.state.batteryTwoVoltage = line[2];
                this.state.timestamp = line[1];
                break;
            case "System Temp_reading":
                this.state.temperature = line[2];
                this.state.timestamp = line[1];
                break;
            default:
                var readingPos = line[0].indexOf("_reading");

                if (readingPos > -1) {
                    sensorId = line[0].substr(0, readingPos);
                    this.logDebug("Reading daily value from " + sensorId + ": " + line[2]);
                    this.logDebug("Time:", new Date(line[1]).toISOString());
                } else {
                    sensorId = line[0];

                    this.logDebug("Reading value from " + sensorId + " for time " + line[1]
                        + " : " + line[2]);
                    this.logDebug("Time:", new Date(line[1]).toISOString());
                }
                break;
        }

        deferred.resolve();
        return deferred.promise;
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
     * @param unitState
     */
    DataLogger.prototype.updateSensors = function (unitState) {
        try {
            var currentPort;

            for (var n in this.actors) {
                currentPort = unitState.ports[this.actors[n].configuration.portNumber];

                if (currentPort) {
                    this.actors[n].updateReading(currentPort);
                }
            }
        } catch (e) {
            this.logError("Error reading temperature.", e);
        }
    }

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
