angular.module('testApp', [])
    .controller('TestController', function () {
        this.dataLogger = {
            _state: {
                externalPowerVoltage: 0.123,
                batteryOneVoltage: 7.444,
                batteryOneLevel: 70,
                batteryTwoVoltage: 6.545,
                batteryTwoLevel: 50,
                temperature: 21.9
            }
        };
        this.channel = {_state: {cumulatedReading: 27}};
    });