module.exports = {
    metadata: {
        plugin: "Channel",
        label: "Channel",
        role: "actor",
        family: "channel",
        deviceTypes: ["halytech/dataLogger"],
        services: [],
        state: [{
            id: "consumption", label: "Consumption",
            type: {
                id: "decimal"
            }
        }, {
            id: "cumulatedConsumption", label: "Cumulated Consumption",
            type: {
                id: "decimal"
            }
        }],
        configuration: [{
            label: "Channel",
            id: "channel",
            type: {
                id: "string"
            },
            defaultValue: "ETGD0018"
        }, {
            label: "Name",
            id: "name",
            type: {
                id: "string"
            },
            defaultValue: "Bondi Beach Sth Park"
        }]
    },
    create: function () {
        return new Channel();
    }
};

var q = require('q');
var readings;
var cumulatedReadings;

/**
 *
 */
function Channel() {


    /**
     *
     */
    Channel.prototype.start = function () {
        this.started = true;
        this.intervals = [];
        this.simulationIntervals = [];
        readings = [];
        cumulatedReadings = [];

        this.state = {
            temperature: 0,
        };

        if (this.isSimulated()) {
            this.state.consumption = 0;
            this.state.cumulatedConsumption = 235;

            this.simulationIntervals.push(setInterval(function () {
                this.state.consumption = Math.round(Math.random() * 2, 3);
                this.state.cumulatedConsumption += this.state.consumption;
                this.publishStateChange();
                this.logDebug("Simulated new reading: " + this.state.currentReading
                    + "(" + this.state.cumulatedConsumption + ")");
            }.bind(this), 10000));
        }

        return q();
    };

    /**
     *
     */
    Channel.prototype.stop = function () {
        this.started = false;

        try {
            this.logInfo("Stopping channel " + this.configuration.name + " of device "
                + this.device.configuration.name + ".");
        } catch (e) {
        }

        for (var interval in this.intervals) {
            clearInterval(interval);
        }

        for (var interval in this.simulationIntervals) {
            clearInterval(interval);
        }

        this.state.temperature = 0;
        return q();
    };

    /**
     *
     */
    Channel.prototype.getState = function () {
        return this.state;
    };

    /**
     *
     */
    Channel.prototype.setState = function (state) {
        this.state = state;
        this.publishStateChange();
    };

    /**
     *
     */
    Channel.prototype.addReading = function (reading) {
        readings.push(reading);
    };

    /**
     *
     */
    Channel.prototype.addCumulatedReading = function (cumulatedReading) {
        cumulatedReadings.push(cumulatedReading);
    };

    /**
     *
     */
    Channel.prototype.publishReadings = function () {
        this.logInfo("Publishing readings for channel" + this.configuration.name + " of device "
            + this.device.configuration.name + ".");
        this.logDebug("Readings");
        this.logDebug(readings);
        this.logDebug("Cumulated Readings");
        this.logDebug(cumulatedReadings);
        readings = [];
        cumulatedReadings = [];
    };
};
