'use strict';

function Ingest (window, document) {
  // Global Vars
  this._window = window;
  this._document = document;
  this.AUTH = 'https://login.ingest.io/token';
  this.IngestSDK = null;

  this.livestreams = [];

  // Login References
  this.clientCallback = this._document.querySelector('.login__form #clientCallback');
  this.clientID = this._document.querySelector('.login__form #clientID');
  this.clientSecret = this._document.querySelector('.login__form #clientSecret');
  this.livestreamTitle = this._document.querySelector('.create--livestream #livestreamTitle')
  this.submitBtn = this._document.querySelector('.login__form #loginBtn');
  this.createBtn = this._document.querySelector('.create--livestream #createBtn')

  // Section Refs
  this.loginSection = this._document.querySelector('.login__form');
  this.livestreamSection = this._document.querySelector('.livestream__section');
  this.livestreamList = this._document.querySelector('.livestream__section .livestreams');
  this.livestream = this._document.querySelector('.livestream__section .livestream');

  // Listeners
  this.submitBtnClick = this.submitBtn.addEventListener('click', this.login.bind(this));
  this.createBtn = this.createBtn.addEventListener('click', this.createLivestream.bind(this));
}

/**
 * Logs you in to Ingest as a CLiant Application
 */
Ingest.prototype.login = function () {
  var client_id, client_secret, grant_type, client_scopes;
  var request, requestOptions, authUrl;

  grant_type = '?grant_type=client_credentials';
  client_id = '&client_id=' + this.clientID.value;
  client_secret = '&client_secret=' + this.clientSecret.value;
  client_scopes='&scope=all';

  authUrl = this.AUTH + grant_type + client_id + client_secret + client_scopes;

  request = new XMLHttpRequest();
  request.onreadystatechange = this.loginComplete.bind(this, request)
  request.open('POST', authUrl);
  request.send();
};

/**
 * Called when login is complete
 */
Ingest.prototype.loginComplete = function (request, response) {
  switch (request.readyState) {
    case 4:
    this.IngestSDK = new IngestSDK({
      token: 'Bearer ' + JSON.parse(request.responseText).access_token
    });

    this.loginSection.classList.add('hide');
    this.livestreamSection.classList.remove('hide');

    this.getLivestreams();
  }
}

/**
 * Gets Livestreams
 */
Ingest.prototype.getLivestreams = function () {
  this.IngestSDK.livestreams.getAll(null, 'idle,running')
    .then(
      this.getLivestreamsSuccess.bind(this),
      function (error) {
        console.log('error', error)
      }
    )
}

/**
 * Called when get livestreams is successful
 */
Ingest.prototype.getLivestreamsSuccess = function (response) {
  this.livestreams = response.data;
  this.generateLivestreamList();
}

/**
 * Generates a list of livestreams
 */
Ingest.prototype.generateLivestreamList = function () {
  var list, title, play, rtmp, stream, listItem;

  list = this._document.createElement('ul');

  for (var i = 0; i < this.livestreams.length; i++) {
    listItem = this._document.createElement('li');

    title = this._document.createElement('div');
    title.classList.add('title');
    title.innerHTML = this.livestreams[i].title + ' (Click to view)';

    listItem.appendChild(title);
    listItem.addEventListener('click', this.initializeLivestream.bind(this, this.livestreams[i]));
    list.appendChild(listItem);
  }

  this.livestreamList.innerHTML = '';
  this.livestreamList.appendChild(list);
}

/**
 * Called when a livestream is clicked. Initializes the view
 */
Ingest.prototype.initializeLivestream = function (livestream) {
  var stream, title, play, rtmp, video;

  stream = this._document.createElement('div');
  title = this._document.createElement('div');
  play = this._document.createElement('div');
  rtmp = this._document.createElement('div');
  video = this._document.createElement('div');

  stream.classList.add('stream');

  title.classList.add('title');
  title.innerHTML = livestream.title;

  play.classList.add('play');
  play.innerHTML = 'PlaybackURL: ' + livestream.play_url;

  rtmp.classList.add('rtmp');
  rtmp.innerHTML = 'RTMP URL: ' + livestream.rtmp_url;

  video.classList.add('player');
  video.id = 'player';

  stream.appendChild(title);
  stream.appendChild(play);
  stream.appendChild(rtmp);
  stream.appendChild(video);

  this.livestream.innerHTML = '';
  this.livestream.appendChild(stream);

  if (this.player) {
    this.player.destroy();
  }

  this.initializePlayer(livestream);
}

/**
 * Initializes the Ingest Player
 */
Ingest.prototype.initializePlayer = function (livestream) {
  var playerOptions = {
    source: livestream.play_url,
    height: 360,
    width: 640,
    mediacontrol: {
      seekbar: '#4f009a'
    },
    preload: 'none',
    parentId: '#player'
  };

  // Check if the browser supports Media Source Extensions with hls.js, if not, we need Flash to playback the video.
  if (!Clappr.HLS.HLSJS.isSupported()) {
    playerOptions.plugins = [Clappr.FlasHLS];
  };

  // Construct the player
  this.player = new Clappr.Player(playerOptions);
}

/**
 * Creates a new livestream
 */
Ingest.prototype.createLivestream = function () {
  var livestream = {
    title: this.livestreamTitle.value
  }

  this.IngestSDK.livestreams.add(livestream)
    .then(
      this.createLivestreamSuccess.bind(this),
      function (error) {
        console.log('error', error)
      }
    )
}

/**
 * Generates a new list of livestream s with the newly added list
 */
Ingest.prototype.createLivestreamSuccess = function (response) {
  this.livestreams.unshift(response.data);
  this.livestreamTitle.value = '';
  this.generateLivestreamList();
}

