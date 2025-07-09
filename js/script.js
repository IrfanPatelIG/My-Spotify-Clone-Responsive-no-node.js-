console.log(`Let's start writting JS code!`);

let songs;
let currFolder;
let currentSong = new Audio();
let playPauseBtn = document.querySelector("#playPause");
let currentSongName = document.querySelector(".current_song_name").firstElementChild;
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
    let a = await fetch(`/audios/${folder}/`);
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


    // Displaying songs in palylist section in sidebar
    // setting default song on playbar to play
    currentSong.src = songs[0];
    currentSong.addEventListener("loadedmetadata", ()=>{
        currentSong.volume = volumeBar.value / 100;
        songTime.innerHTML = `00:00 / ${formatTime(currentSong.duration)}`;
        document.querySelector("#volumeBar").value = currentSong.volume * 100;
        currentSongName.style.paddingLeft = "0%";
    });
    currentSongName.innerHTML = decodeString(songs[0]);
    console.log(`Default song is loaded ${currentSong.src} with volume`,currentSong.volume);

    // Populating the actual <ul> of songs where all the songs suppose to be listed
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

    // Playing song on click / attached an event listener to each song
    Array.from(playList.getElementsByTagName("li")).forEach((e) => {
        e.addEventListener("click", ()=> {
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

async function displayAlbums() {
    let albumsHTML = await fetch("/audios/")
    let response = await albumsHTML.text();

    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.querySelectorAll("#files a");
    let mainCardContainer = document.getElementsByClassName("card_container")[0];
    for (let i=0; anchors.length > i; i++) {
        if(anchors[i].href.includes("/audios/")) {
            let folderName = anchors[i].href.split("/audios/")[1];
            let infoFile = await fetch(`/audios/${folderName}/info.json`)
            let infoJson = await infoFile.json();
            

            let bg_img = `style="background-image: url(../img/default_cover.png) !important;"`;
            const coverFile = `cover.jpg`;
            try {
                const res = await fetch(`/audios/${folderName}`);
                const html = await res.text();
                const divRes = document.createElement("div");
                divRes.innerHTML = html;

                const anchors = divRes.querySelectorAll("#files li a");

                for (const anchor of anchors) {
                    const file = anchor.href.split(`/audios/${folderName}/`)[1];
                    if (file === coverFile) {
                        bg_img = `style="background-image: url(/audios/${folderName}/${coverFile}) !important;"`;
                        break;
                    }
                }
            } catch (err) {
                console.error("Error fetching folder contents:", err);
            }

            let card = `<div data-folderName="${folderName}" class="card flex">
                        <div class="play_button"></div>
                        <div class="card_img" ${bg_img}>
                            <!-- Playlist Image -->
                        </div>
                        <div class="card_info flex">
                            <h3>${infoJson.title}</h3>
                            <p>${infoJson.description}</p>
                        </div>
                    </div>`;
            mainCardContainer.innerHTML += card;
        }
    }

    // Populating the Albums in Songs Playlist Container Dynamically / Displaying the Album's Song in the Library section 
    let cards = document.querySelectorAll(".card");
    cards.forEach(e => {
        let folderName = e.dataset.foldername;
        const playBtn = e.querySelector(".play_button");

        // Separate play button Eventlistener to play 1st song
        playBtn.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            await fetchSongs(folderName);
            resumeMusic();
            playPauseBtn.style.backgroundImage = "url(\"img/pause.svg\")";
            document.querySelector(".song-playlist-heading").innerHTML = e.querySelector(".card_info h3").innerText + " - Playlist";
        });

        // Full card Eventlistener for just listing the songs
        e.addEventListener("click", async () => {
            await fetchSongs(folderName);
            playPauseBtn.style.backgroundImage = "url(\"img/play.svg\")";
            document.querySelector(".song-playlist-heading").innerHTML = e.querySelector(".card_info h3").innerText + " - Playlist";
        });
    });

}

async function main() {

    displayAlbums();

    // Logic of Play / Pause button
    playPauseBtn.addEventListener("click", (e) => {
        if(currentSong.paused) {
            console.log(`Paying Song: ${decodeString(currentSong.src)}`);
            resumeMusic();
            playPauseBtn.style.backgroundImage = "url(\"img/pause.svg\")";
            currentSongName.style.animation =`scrollText 14s linear infinite`;
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

    // Moving seekbar with song duration
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
    volumeDiv.firstElementChild.classList.add("volumeOff");
    volumeDiv.firstElementChild.classList.remove("volumeOff");
    // volumeDiv.firstElementChild.classList.add("volumeOn");
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
            } else if (e.key === " " && currentSong.src.length > 0) {
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

main();


