console.log(`Let's start writting JS code!`);

let songs;
let currFolder = "naath";
let currentSong = new Audio();
let playPauseBtn = document.querySelector("#playPause");
let currentSongName = document.querySelector(".current_song_name").firstElementChild;
let count = 0;
let songTime = document.querySelector(".song_time");

function formatTime(seconds) {
    if(isNaN(seconds) || seconds < 0) {
        return 0;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSec = Math.floor(seconds % 60);

    const formatedMins = String(minutes).padStart(2, '0');
    const formatedSecs = String(remainingSec).padStart(2, '0');

    return `${formatedMins}:${formatedSecs}`;
}

function animateSongName() { // song name left to right
    const textContainer = document.querySelector(".current_song_name");
    const songName = textContainer.querySelector("p");

    // Reset animation and padding first
    songName.style.animation = "none";
    songName.style.paddingLeft = "0";
    songName.style.transform = "translateX(0)";

    // Small delay to allow DOM update
    setTimeout(() => {
        const containerWidth = textContainer.offsetWidth;
        const textWidth = songName.scrollWidth;

        if (textWidth > containerWidth) {
            songName.style.paddingLeft = "100%";
            songName.style.animation = "scrollText 14s linear infinite";
        }
    }, 20);
}

async function fetchSongs(folder) {
    currFolder = folder
    let a = await fetch(`http://127.0.0.1:5500/audios/${folder}/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let anchors = div.querySelectorAll("#files a");

    songs = [];
    anchors.forEach(a => {
        if (a.href.endsWith(".mp3")) {
            songs.push(a.href);
        }
    });


    // TESTING!!!!!!!!!!
    document.querySelector(".song-playlist-heading").innerHTML = currFolder + " - Playlist";
    // setting default song on playbar to play
    currentSong.src = songs[0];
    currentSong.addEventListener("loadedmetadata", ()=>{
        currentSong.volume = volumeBar.value / 100;
        songTime.innerHTML = `00:00 / ${formatTime(currentSong.duration)}`;
        document.querySelector("#volumeBar").value = currentSong.volume * 100;
        currentSongName.style.paddingLeft = "0%";
        resumeMusic();
    });
    currentSongName.innerHTML = decodeString(songs[0]);
    console.log(`Default song is loaded ${currentSong.src} with volume`,currentSong.volume);

    let playList = document.querySelector("#songs_playlist_id");
    playList.innerHTML = "";
    for (let i = 0; i < songs.length; i++) {
        let songInfoHeading = `<li>
                    <div class="song_img"></div>
                    <div class="song_name">
                        <h4>${decodeString(songs[i])}</h4>
                        <p>Artist: Unkown</p>
                    </div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#a4a4a4" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20V4L19 12L5 20Z" stroke="#a9a9a9" stroke-width="1.5" stroke-linejoin="round"/>
                    </svg>
                </li>`;
        playList.innerHTML += songInfoHeading;
    }

    // Playing song on click / attach an event listener to each song
    Array.from(playList.getElementsByTagName("li")).forEach((e) => {
        e.addEventListener("click", (element)=> {
            console.log(e.querySelector(".song_name").firstElementChild.innerHTML.trim());
            let singleSong = e.querySelector(".song_name").firstElementChild.innerHTML.trim();
            playMusic(singleSong);
        })
    })

    return songs;
}

let playMusic = (track) => {
    currentSong.src = `/audios/${currFolder}/`+track;
    console.log(`Paying Song: ${decodeString(currentSong.src)}`);
    currentSong.play();
    playPauseBtn.style.backgroundImage = "url(\"img/pause.svg\")";
    currentSongName.innerHTML = track;
    songTime.innerHTML = `00:00 / 00:00`;
    console.log("Volume is:", currentSong.volume);
    animateSongName();
}

async function main() {

    // Populating the Albums in Playlist Container Dynamically
    let cards = document.querySelectorAll(".card");
    cards.forEach(e => {
        e.addEventListener("click", async () => {
            currFolder = e.dataset.foldername;
            console.log(currFolder);
            document.querySelector(".song-playlist-heading").innerHTML = currFolder + " - Playlist";
            await fetchSongs(currFolder);
            playPauseBtn.style.backgroundImage = "url(\"img/pause.svg\")";
        });
    });

    // Logic of Play / Pause button
    playPauseBtn.addEventListener("click", (e) => {
        if(currentSong.paused) {
            console.log(`Paying Song: ${decodeString(currentSong.src)}`);
            resumeMusic();
            playPauseBtn.style.backgroundImage = "url(\"img/pause.svg\")";
            currentSongName.style.animation =`scrolltext 14s linear infinite`;
        } else {
            pauseMusic();
            console.log(`Paused Song: ${decodeString(currentSong.src)}`);
            playPauseBtn.style.backgroundImage = "url(\"img/play.svg\")";
            currentSongName.style.animation = "none";
            currentSongName.style.paddingLeft = "0%";
        }
    })

    // Logic of Previous Song Play button
    document.querySelector(".play_previous").addEventListener("click", (e)=>{
        let currentSongIndex = songs.indexOf(currentSong.src) - 1;
        console.log(`CurrentSongIndex: ${currentSongIndex}`);
        if(currentSongIndex >= 0) {
            playMusic(decodeString(songs[currentSongIndex]));
        }
    });

    // Logic of Next Song Play button
    document.querySelector(".play_next").addEventListener("click", (e)=>{
        let currentSongIndex = songs.indexOf(currentSong.src) + 1;
        console.log(`CurrentSongIndex: ${currentSongIndex}`);
        if(currentSongIndex < songs.length) {
            playMusic(decodeString(songs[currentSongIndex]));
        }
    });

    let songProgressCircle;
    // Listen to timeupdate of currentSong 
    currentSong.addEventListener("timeupdate", (e) => {
        count += 1;
        let duration = formatTime(currentSong.duration);
        let current_time = formatTime(currentSong.currentTime);
        songTime.innerHTML = `${current_time} / ${duration}`;
        songProgressCircle = document.querySelector(".seekbar_progress_circle");
        let progressPercent = (currentSong.currentTime / currentSong.duration) * 100;
        progressPercent = Math.min(progressPercent, 100);
        songProgressCircle.style.left = (progressPercent) + "%";
        document.querySelector(".seekbar_fill").style.width = progressPercent + "%";
        if(progressPercent === 100) {
            playPauseBtn.style.backgroundImage = "url(\"img/play.svg\")";
            if(currentSong.paused) {
                currentSongName.style.animation = "none";
            }
        }
    });

    // Moving seekbar with songs duration
    let seekbar = document.querySelector(".seekbar");
    seekbar.addEventListener("click", (e)=>{
        let seekbarRect = seekbar.getBoundingClientRect();
        let clientX = e.clientX - seekbarRect.left;
        let seekPercent = (clientX / seekbarRect.width) * 100;
        songProgressCircle.style.left = seekPercent + "%";
        currentSong.currentTime = (currentSong.duration * seekPercent) / 100 ;
    })

    // Controling volume using input:range
    let volumeBar = document.querySelector("#volumeBar");
    volumeBar.addEventListener("click", (e)=>{
        let volume = (e.target.value) / 100;
        currentSong.volume = volume;
        console.log("Volume is changed to:",volume);
    })
    // show current volume on hover
    const volumeSlider = document.querySelector(".volumeSlider");
    const volumeValue = document.querySelector(".volume_value");
    volumeSlider.addEventListener("input", (e)=>{
        let volume = (e.target.value) / 100;
        currentSong.volume = volume;
        console.log("Volume is changed to:",volume);
        volumeValue.innerText = volumeSlider.value;
    });
    volumeSlider.addEventListener("mouseover", ()=>{
        volumeValue.innerText = volumeSlider.value;
    });
    volumeSlider.addEventListener("mouseout", ()=>{
        volumeValue.innerText = "";
    });

    // Mute / Unmute
    let volumeDiv = document.querySelector(".volume");
    volumeDiv.firstElementChild.addEventListener("click", ()=>{
        volumeDiv.firstElementChild.classList.toggle("volumeOff");
        if(volumeDiv.firstElementChild.classList.contains("volumeOff")) {
            currentSong.muted = true;
            console.log(`Song Muted`);
        } else {
            currentSong.muted = false;
            console.log(`Song Unmuted`);
        }
    });


    // Controling actions using Keyboard keys
    document.addEventListener("keydown", (e) => {
        if(e.ctrlKey == false) {
            if (e.key === "ArrowUp") {
                currentSong.volume = Math.min(currentSong.volume + 0.01, 1);
                volumeBar.value = currentSong.volume * 100;
            } else if (e.key === "ArrowDown") {
                currentSong.volume = Math.max(currentSong.volume - 0.01, 0);
                volumeBar.value = currentSong.volume * 100;
            } else if (e.key === "ArrowLeft") {
                currentSong.currentTime -= 10;
            } else if (e.key === "ArrowRight") {
                currentSong.currentTime += 10;
            } else if (e.key === " ") {
                e.preventDefault();
                if (currentSong.paused) {
                    resumeMusic();
                    playPauseBtn.style.backgroundImage = "url('img/pause.svg')";
                    currentSongName.style.animation = `scrolltext 14s linear infinite`;
                } else {
                    pauseMusic();
                    playPauseBtn.style.backgroundImage = "url('img/play.svg')";
                    currentSongName.style.animation = "none";
                    currentSongName.style.paddingLeft = "0%";
                }
            } else {
                console.log("Other key:", e.key);
            }
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key === "ArrowRight") {
            e.preventDefault();
            let currentTrack = decodeString(currentSong.src);
            let currentSongIndex = songs.findIndex(s => decodeString(s) === currentTrack);
            if (currentSongIndex + 1 < songs.length) {
                playMusic(decodeString(songs[currentSongIndex + 1]));
            }
        } 
        if (e.ctrlKey && e.key === "ArrowLeft") {
            e.preventDefault();
            let currentSongIndex = songs.indexOf(currentSong.src) - 1;
            console.log(`CurrentSongIndex: ${currentSongIndex}`);
            if(currentSongIndex >= 0) {
                playMusic(decodeString(songs[currentSongIndex]));
            }
        }
    });

    // Hamburger Logic to Remove/Add Sidebar 
    let removeSideBar = () => {
        console.log(`Removed Sidebar`);
        sideBar.classList.remove("showSideBar");
    }
    let sideBar = document.querySelector(".sidebar");
    let hamburger = document.querySelector(".hamburger");
    let closeIcon = document.querySelector(".close-icon");
    setInterval(() => {
        if (sideBar.classList.contains("showSideBar")) {
            closeIcon.style.display = "flex";
        } else {
            closeIcon.style.display = "none";
        }
    }, 100)
    hamburger.addEventListener("click", () => {
        console.log(`Added Sidebar`);
        sideBar.classList.add("showSideBar");
    });
    closeIcon.addEventListener("click", () => {
        removeSideBar();
    });
    document.querySelector(".main_container").addEventListener("click", () => {
        if (sideBar.classList.contains("showSideBar")) {
            removeSideBar();
        }
    });
}

let pauseMusic = () => {
    currentSong.pause();
}
let resumeMusic = () => {
    currentSong.play();
}

let decodeString = (str) => {
    return str.split(`/audios/${currFolder}/`)[1].replaceAll("%20", " ").replaceAll("_", " ")
}

async function addAlbums() {
    document.querySelector(".song-playlist-heading").innerHTML = document.querySelectorAll(".card")[0].dataset.foldername;
}

main();


