angular.module('testApp', [])
    .controller('TestController', function () {
        this.dataLogger = {
            _state: {
                externalPowerVoltage: 0.123,
                batteryOneVoltage: 7.432, batteryTwoVoltage: 6.543, temperature: 21.9
            }
        };
        this.channel = {_state: {cumulatedReading: 27}};
    });