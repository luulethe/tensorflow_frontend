'use strict';

/**
 * @ngdoc function
 * @name hackathonWebClientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the hackathonWebClientApp
 */
angular.module('hackathonWebClientApp')
  .controller('MainCtrl', ['$rootScope', '$scope', '$http', '$timeout', function ($scope, $http, $timeout) {
    $scope.isSendingRequest = false;
    $scope.countDownSeconds = 0;
    $scope.data = {
      user: null
    };
    $scope.currentTime = new Date().getTime();
    $scope.countDownMap = {};

    $scope.startCountDown = function () {
      if ($scope.countDownMap[$scope.data.user.id] == null && $scope.countDownMap[$scope.data.user.id] == undefined) {
        $scope.countDownMap[$scope.data.user.id] = true;
        $scope.countDownSeconds = 5;
        var x = setInterval(function () {
          if ($scope.countDownSeconds > 0) {
            $scope.countDownSeconds = $scope.countDownSeconds - 1
          }
        }, 1000);
      }
    };

    $scope.confirmOrder = function () {
      var data = new FormData();
      data.append('user_id', $scope.data.user.id);
      data.append('session_id', 1);
      $scope.isSendingRequest = true;
      $.ajax({
        url: 'https://tensorflow.vi123456.com/api/session/person/confirm/',
        method: 'POST',
        data: data,
        processData: false,
        contentType: false,
        success: function (response) {
          console.log("confirm success ", response);
          $scope.$apply(function () {
            $scope.isSendingRequest = false;
            if (response.error == "OK") {
              $scope.data.user.joined = true;
            }
          });
        },
        error: function (error) {
          $scope.$apply(function () {
            $scope.isSendingRequest = false;
          });
          console.log("confirm error");
        }
      });
    };

    function firstInitialize() {
      var video = document.getElementById('video');
      var canvas = document.getElementById('canvas');
      var context = canvas.getContext('2d');

      //add new code
      var myTracker = new tracking.ObjectTracker('face');
      var trackerTask = tracking.track('#video', myTracker, {camera: true});
      myTracker.setInitialScale(4);
      myTracker.setStepSize(2);
      myTracker.setEdgesDensity(0.1);
      myTracker.on('track', function (event) {
        if (event.data.length === 0) {
          //No Event
        } else {
          context.clearRect(0, 0, canvas.width, canvas.height);
          //handle custom logic
          $scope.$apply(function () {
            var now = new Date().getTime();
            if (($scope.data.user == null || $scope.data.user.joined == true || $scope.isSendingRequest == false) && now > $scope.currentTime + 1500) {
              $scope.currentTime = now;
              if ($scope.data.user == null) {
                $scope.isSendingRequest = true;
              }
              trackerTask.stop();
              var frame = captureVideoFrame('video', 'png');
              var img = document.getElementById('my-screenshot');
              img.setAttribute('src', frame.dataUri);
              //generate form data
              var formData = new FormData();
              formData.append('file', frame.blob, 'my-screenshot.' + frame.format);
              formData.append('session_id', 1);

              $.ajax({
                url: 'https://tensorflow.vi123456.com/api/image/upload/',
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (data) { //success
                  var user = data[0];
                  if (user.name != 'unknown') {
                    $scope.data.user = user;
                    $scope.isSendingRequest = false;
                    if (user.joined == false) {
                      var userFormData = new FormData();
                      userFormData.append('person_id', user.id);
                      $.ajax({
                        url: 'https://tensorflow.vi123456.com/api/food/order/get_by_user/',
                        method: 'POST',
                        data: userFormData,
                        processData: false,
                        contentType: false,
                        success: function (userData) {
                          $scope.$apply(function () {
                            $scope.isSendingRequest = false;
                            $scope.data.user = angular.merge($scope.data.user, userData);
                            console.log("This is user ", $scope.data.user);
                            //start the countdown here
                            if ($scope.data.user.joined == false){
                              $scope.startCountDown();
                            }
                          });
                        },
                        error: function (error) {
                          $scope.$apply(function () {
                            $scope.isSendingRequest = false;
                          });
                          console.log("Error when getting food info");
                        }
                      });
                    }
                  }
                },
                error: function (data) {
                  $scope.isSendingRequest = false;
                }
              });
            }
          });
          // Plots the detected targets here.
          event.data.forEach(function (rect) {
            context.strokeStyle = '#a64ceb';
            context.strokeRect(rect.x, rect.y, rect.width, rect.height);
            context.font = '11px Helvetica';
            context.fillStyle = "#fff";
            context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
            context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
          });
        }
      });
      trackerTask.run();
    }

    firstInitialize();
  }
  ])
;
