var sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');
var library = models.library;
var player = models.player;
var playstate = true;
var timeLeft = INTERVAL;
var lastPlay = 0;
var interval; // id for INTERVAL-spaced intervals
var resume; // id for unpaused (timeLeft) intervals. could probably just have one id

var INTERVAL = 4000;
var ROUNDS = 10;

exports.init = init;
exports.start_with_url = start_with_url;
exports.playlist_info = playlist_info;

function init() {
   console.log(player);
}

function start_with_url(playlist_url) {
   // why does timeLeft fail to update properly when a second playlist is loaded?
   player.shuffle = true;
   player.repeat = true;
   if (interval) {
      // if intervals exist from the previous instantiation? I don't understand javascript
      clearInterval(interval);
   }
   if (resume) {
      clearInterval(resume);
   }
   timeLeft = INTERVAL;
   console.log("start_with_url: " + playlist_url);
   var playlist = models.Playlist.fromURI(playlist_url, function(playlist) { 
      start_powerhour(playlist); 
   });
}

function start_powerhour(playlist) {
   var random = (Math.random() + Math.random() + Math.random() + Math.random());
   random *= playlist.tracks.length / 4;
   lastPlay = new Date().getTime();
   console.log("lastPlay set to: " + lastPlay);

   player.play(playlist.tracks[Math.floor(random)], playlist);
   console.log(player);

   interval = setInterval(advance_track, INTERVAL);

   player.observe(models.EVENT.CHANGE, function(event) {
      if (event.data.playstate && !(event.data.curtrack)) {
         playstate = !playstate;
         if (playstate) { // player is currently playing
            console.log("play");
            press_play();
         } else { // player is currently paused
            console.log("pause");
            timeLeft = timeLeft - ((new Date().getTime()) - lastPlay);
            console.log("timeLeft: " + timeLeft);
            if (resume) {
               console.log("clear resume1");
               clearInterval(resume);
            }
            console.log("clear std_play");
            clearInterval(interval);
         }
      }
   });
}

function press_play() {
   lastPlay = new Date().getTime();
   console.log("lastPlay set to: " + lastPlay);
   resume = setInterval(play_resume, timeLeft);
   console.log("resume set with: " + timeLeft);
}

function play_resume() {
   console.log(player.track.data.duration);
   play_at_interval();
   console.log("clear resume2");
   clearInterval(resume);
}

function play_at_interval() {
   advance_track();
   console.log("lastPlay set to: " + lastPlay);
   interval = setInterval(advance_track, INTERVAL);
   console.log("set interval");
   timeLeft = INTERVAL;
}

function advance_track() {
   player.next();
   lastPlay = new Date().getTime();
   console.log("(advance_track) lastPlay set to: " + lastPlay);

   var handbag = get_handbag_for_track(player.track);
   console.log("handbag: " + handbag);

   var track_uri = player.track.data.uri + handbag;
   console.log("track duration: " + player.track.data.duration);
   player.play(track_uri);
}

function get_handbag_for_track(track) {
   var pos_seconds = Math.floor(Math.random() * Math.max(0, ((track.data.duration/1000) - 60)));
   var minute = (pos_seconds / 60) | 0; // converts to int (truncates)
   pos_seconds = pos_seconds % 60;
   if (pos_seconds < 10) {
      pos_seconds = "0" + pos_seconds;
   }
   return "#" + minute + ":" + pos_seconds;
}

function playlist_info(playlist_uri) {
   var playlist_obj = models.Playlist.fromURI(playlist_uri);
   var info = playlist_obj.name + " (" + playlist_obj.tracks.length + " songs)";
   return info;
}