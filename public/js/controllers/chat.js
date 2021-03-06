angular.module('mean.system')
.controller('ChatController', ['$scope', '$location','$firebaseArray', 'game', function($scope, $location, $firebaseArray, game) {
  let firebaseUrl;
  if ($location.search().game) {
    firebaseUrl = `https://vahalla-cfh.firebaseio.com/${$location.search().game}`
  } else {
    firebaseUrl = `https://vahalla-cfh.firebaseio.com/${game.gameID}`;
  }
  const ref = new Firebase(firebaseUrl);
  $scope.messages = $firebaseArray(ref);
  $scope.messageAlert = 0;

  $scope.sendMessage = () => {
    let message = emoji.data('emojioneArea').getText();
    
    if (message && message !== '') {
      $scope.messages.$add({
        message,
        date: Date.now(),
        avatar: game.players[game.playerIndex].avatar,
        username: game.players[game.playerIndex].username
      });
      emoji.data('emojioneArea').setText('');
    }
  };

  $scope.messages.$watch((e) => {
    if (e.event === 'child_added' && !$scope.displayChat) {
      $scope.messageAlert += 1;
    } else {
      $scope.messageAlert = 0;
    }
  });

  // toggles the chat and the chat indicator
  $scope.displayChat = false;
  $scope.toggleChatBox = () => {
    $scope.displayChat = !$scope.displayChat;
    if ($scope.displayChat) {
      $scope.messageAlert = 0;
      // wait for the chatbox to be rendered then focus on the input field
      setTimeout(() => {
        angular.element("#chatInput").focus();
      }, 1000);
    }
  };

  const emoji = $("#chatInput").emojioneArea({
    hidePickerOnBlur: true,
		pickerPosition: "top",
    tonesStyle: 'radio',
    searchPosition: "bottom",
    events: {
      keyup: (editor, event) => {
        if (event.keyCode === 13) {
          $scope.sendMessage();
        }
      },
      emojibtn_click: (button, event) => {
        $('.emojionearea-button-close').click();
      }
    }
  });
  
}]);
