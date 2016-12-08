module.exports = {
    metadata: {
        plugin: "Channel",
        label: "Channel",
        role: "actor",
        family: "channel",
        deviceTypes: ["halytech/dataLogger"],
        services: [],
        state: [{
            id: "reading", label: "Reading",
            type: {
                id: "decimal"
            }
        }, {
            id: "cumulatedReading", label: "Cumulated Reading",
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
        this.stateChanges = [];

        this.state = {
            temperature: 0,
        };

        this.lastPublished = new Date(1);
        this.lastPublishedCumulatedReading = new Date(1);

        if (this.isSimulated()) {
            this.state.reading = 0;
            this.state.cumulatedReading = 235;

            this.simulationIntervals.push(setInterval(function () {
                this.state.reading = Number((Math.random() * 1.5).toFixed(3));
                this.state.cumulatedReading += this.state.reading;
                this.state.cumulatedReading = Number(this.state.cumulatedReading.toFixed(3));

                this.logDebug("Simulated new reading: " + this.state.reading);

                this.stateChanges.push({
                    timestamp: new Date(),
                    state: {
                        reading: this.state.reading
                    }
                });
            }.bind(this), 1000));

            this.simulationIntervals.push(setInterval(function () {
                this.logDebug("Simulated new cumulated reading: " + this.state.cumulatedReading);

                this.stateChanges.push({
                    timestamp: new Date(),
                    state: {
                        cumulatedReading: this.state.cumulatedReading
                    }
                });
            }.bind(this), 4000));


            this.simulationIntervals.push(setInterval(function () {
                this.publishHistoricData();
            }.bind(this), 9000));
        }

        return q();
    };

    /**
     *
     */
    Channel.prototype.stop = function () {
        this.started = false;

        try {
            this.logInfo('Stopping channel ' + this.configuration.name + '".');
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
    };

    /**
     *
     */
    Channel.prototype.addReading = function (reading) {
        this.stateChanges.push({
            timestamp: reading.timestamp,
            state: {
                reading: reading.reading
            }
        });
    };

    /**
     *
     */
    Channel.prototype.addCumulatedReading = function (cumulatedReading) {
        this.stateChanges.push({
            timestamp: cumulatedReading.timestamp,
            state: {
                cumulatedReading: cumulatedReading.cumulatedReading
            }
        });
    };

    /**
     *
     */
    Channel.prototype.publishHistoricData = function () {
        var currentStateChange;
        var comparisonTimeReading = this.lastPublished;
        var comparisonTimeCumulatedReading = this.lastPublishedCumulatedReading;

        this.logInfo("Publishing " + this.stateChanges.length + " channel state changes.");

        this.publishStateChangeHistory(this.stateChanges);

        for (var n in this.stateChanges) {
            currentStateChange = this.stateChanges[n];

            if (currentStateChange.state.reading) {
                if (currentStateChange.timestamp > comparisonTimeReading) {
                    this.state.reading = currentStateChange.state.reading;
                    this.lastPublished = currentStateChange.timestamp;
                }
            } else if (currentStateChange.state.cumulatedReading) {
                if (currentStateChange.timestamp > comparisonTimeCumulatedReading) {
                    this.state.cumulatedReading = currentStateChange.state.cumulatedReading;
                    this.lastPublishedCumulatedReading = currentStateChange.timestamp
                }
            }

        }

        this.publishStateChange();
        this.stateChanges = [];
        this.logDebug('Finished publishing historic channel state changes.');
        return q();
    };
}
