console.log('js script loaded');

let currentSong = new Audio();
let songs;
let currentFolder;
let audioContext;
let musicbars = document.querySelector(".music-bars");


async function getSongs(folder) {
    currentFolder = folder;
    // let a = await fetch(`http://172.20.10.10:5500/${folder}/`);
    let a = await fetch(`http://127.0.0.1:5500/${folder}/`);
    let response = await a.text();
    // console.log(response);
    let div = document.createElement('div');
    div.innerHTML = response;
    let as = div.getElementsByTagName('a');
    console.log(as);
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith('.mp3')) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    //show songs in the songs-list section
    let songul = document.querySelector('.songs-list').getElementsByTagName('ul')[0];
    songul.innerHTML = "";
    for (let song of songs) {
        // song = song.replaceAll("%26", " ");
        // song = song.replaceAll("%5", " ");
        songul.innerHTML = songul.innerHTML + `<li>
        
                            <img class="invert" src="imgs/music.svg" alt="">
                            <div class="info">
                                <div class="songname"> ${song.replaceAll("%20", " ")}</div>
                                <div class="artistname">Artist</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img style ="width: 18px;" class="invert" src="imgs/play-3.svg" alt="">
                            </div>
        </li>`;
    }
    // event listener for each song in the list
    Array.from(document.querySelector(".songs-list").getElementsByTagName("li")).forEach((e, idx) => {
        e.addEventListener("click", element => {
            // Play the clicked song
            playMusic(songs[idx]);
            // Remove background from all list items
            Array.from(document.querySelector(".songs-list").getElementsByTagName("li")).forEach(li => {
                li.style.backgroundColor = "#121212";
            });
            // Set background for the clicked item
            e.style.backgroundColor = "#2e2c2cff";
        });
    });

}

// Function to play music
// This function takes a track name as an argument and plays the corresponding audio file
// const playMusic = (track, pause = false) => {
//     //play the song
//     // let audio = new Audio("/songs/" + track);
//     currentSong.src = `/${currentFolder}/` + track;
//     if (!pause) {
//         currentSong.play();
//         musicbars.style.display = "flex";
        
//         play.src = "imgs/pause.svg";
//     }else{
//         musicbars.style.display = "none";

//     }
//     document.querySelector(".songinfo").innerText = track.replaceAll("%20", " ");
//     document.querySelector(".songduration").innerText = "00:00 / 00:00"; // Placeholder for duration, can be updated later
// }

const playMusic = async (track, pause = false) => {
    // Pause handling
    if (pause) {
        currentSong.pause();
        musicbars.style.display = "none";
        play.src = "imgs/play-3.svg";
        return;
    }
    // Create new URL for comparison
    const newSrc = `/${currentFolder}/${track}`;
    const absoluteNewSrc = new URL(newSrc, window.location.href).href;

    // Only change source if new track is different
    if (currentSong.src !== absoluteNewSrc) {
        currentSong.src = newSrc;
        // Wait for audio to load before playing
        await new Promise((resolve) => {
            currentSong.onloadedmetadata = resolve;
            currentSong.onerror = () => resolve(); // Prevent hanging on error
        });
    }
    // Attempt playback with user gesture handling
    try {
        await currentSong.play();
        musicbars.style.display = "flex";
        play.src = "imgs/pause.svg";
    } catch (err) {
        console.error("Playback failed:", err);
        // Show UI indication that interaction is needed
        play.src = "imgs/play.svg";
        alert("Click 'Play' to start audio. Browsers require user interaction for audio playback.");
    }
    // Update track info
    document.querySelector(".songinfo").innerText = track.replaceAll("%20", " ");
    document.querySelector(".songduration").innerText = "00:00 / 00:00";
};

async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:5500/songs/`);
    let response = await a.text();
    let div = document.createElement('div');
    div.innerHTML = response;
    let ancors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(ancors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];


        // console.log(e.href);
        if (e.href.includes("/songs/")) {
            let folder = e.href.split("/").slice(-1)[0];
            //get meta data of the folder
            let a = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
            let response = await a.json();
            // console.log(response);
            cardContainer.innerHTML = cardContainer.innerHTML + `
             <div data-folder="${folder}" class="card">
                        <div class="play">
                            <img src="imgs/play-2.svg" alt="">
                        </div>

                        <img src="songs/${folder}/cover.png" alt="">
                        <h2>${response.title}</h2>
                        <p>${response.description}</p>
                    </div>
            
            `
        }
    }

    //load the playlist when the card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener('click', async item => {
            console.log('featching songs');
            await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            let songul = document.querySelector('.songs-list').getElementsByTagName('ul')[0];
            
            //display message is there is no songs in the play list
            if (songul && (!songs || songs.length === 0)) {
                songul.innerHTML = `<li>No songs in this folder</li>`;
                songul.getElementsByTagName("li")[0].style.color = "grey";
            }else{ 
                //when some one click the card the first song will play automatically
                playMusic(songs[0]);
            }
        });

    });

}


function initAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    canvas = document.getElementById('waveform');
    canvasCtx = canvas.getContext('2d');
    const source = audioContext.createMediaElementSource(currentSong);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    drawWaveform();
}
function drawWaveform() {
    requestAnimationFrame(drawWaveform);
    analyser.getByteTimeDomainData(dataArray);
    canvasCtx.fillStyle = 'rgba(37, 36, 36, 0.05)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = 'rgba(244, 95, 9, 1)';
    canvasCtx.beginPath();
    const sliceWidth = canvas.width / dataArray.length;
    let x = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);
        x += sliceWidth;
    }
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

async function main() {
    await getSongs("songs/favorite_songs");
    playMusic(songs[0], true); // Play the first song by default
    console.log(songs);

    //Display all the albums on the page
    displayAlbums();

    
    //attach an event listener to the play next and play previous buttons
    play.addEventListener('click', () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "imgs/pause.svg";
             musicbars.style.display = "flex";
             
            } else {
                currentSong.pause();
                play.src = "imgs/play-3.svg";
                musicbars.style.display = "none";
        }
    });
    // Add event listeners to all "Play Now" buttons in the song list
    document.querySelectorAll(".songs-list .playnow img").forEach((playnowImg, idx) => {
        playnowImg.addEventListener('click', (e) => {
            console.log('playnow left is clicked!');
            
            // e.stopPropagation(); // Prevent triggering the li click event
            if (currentSong.src.includes(songs[idx]) && !currentSong.paused) {
                currentSong.pause();
                playnowImg.src = "imgs/play-3.svg";
                play.src = "imgs/play-3.svg";
            } else {
                playMusic(songs[idx]);
                // Update all playnow icons to play, except the current one
                document.querySelectorAll(".songs-list .playnow img").forEach((img, i) => {
                    img.src = i === idx ? "imgs/pause.svg" : "imgs/play-3.svg";
                    play.src = "imgs/pause.svg";
                });
            }
        });
        console.log('left play btn clicked！');
        
    });
    


    //update the song duration
    // Variables to store current and total duration
    let totalDuration = "00:00";

    currentSong.addEventListener('loadedmetadata', () => {
        if (!audioContext) initAudioContext();
        let duration = currentSong.duration;
        let minutes = Math.floor(duration / 60);
        let seconds = Math.floor(duration % 60);
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        totalDuration = `${minutes}:${seconds}`;
        // Initialize with 00:00 as current time
        document.querySelector(".songduration").innerText = `00:00 / ${totalDuration}`;
        // Auto play next song when current ends
        currentSong.addEventListener('ended', () => {
            let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
            if (index !== -1 && index < songs.length - 1) {
            playMusic(songs[index + 1]);
        } else {
                playMusic(songs[0]);
            // Optionally, reset UI when playlist ends
            play.src = "imgs/play-3.svg";
            }
        });

        


    });

    currentSong.addEventListener('timeupdate', () => {
        let current = currentSong.currentTime;
        let minutes = Math.floor(current / 60);
        let seconds = Math.floor(current % 60);
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        document.querySelector(".songduration").innerText = `${minutes}:${seconds} / ${totalDuration}`;
        document.querySelector(".circle").style.left = `${(current / currentSong.duration) * 100}%`;
    });

    //add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener('click', (e) => {
        let seekbar = document.querySelector(".seekbar");
        let rect = seekbar.getBoundingClientRect();
        let x = e.clientX - rect.left; // Get the x position of the click relative to the seekbar
        let width = seekbar.offsetWidth; // Get the width of the seekbar
        let percentage = x / width; // Calculate the percentage of the click position
        currentSong.currentTime = percentage * currentSong.duration; // Set the current time of the song
        // Change the color of the circle before updating its position
        document.querySelector(".seekbar .circle").style.backgroundColor = "white"; // Change color to white
        document.querySelector(".seekbar .circle").style.left = `${percentage * 100}%`; // Update the circle position
    });

    //add an event listener to humburger menu
    document.querySelector(".hamburger").addEventListener('click', () => {
        document.querySelector(".left").style.left = "-15px";
    });
    //add an event listener to cross menu bar
    document.querySelector(".cross").addEventListener('click', () => {
        document.querySelector(".left").style.left = "-100%";
    });
    document.querySelector(".spotify-playlist").addEventListener('click', () => {
        document.querySelector(".left").style.left = "-100%";
    });


    // Event listener for volume control button with smooth transition
    const volumecontrol = document.querySelector("#volumecontrol");
    const rangeInput = document.querySelector(".range input");
    const clickrange = document.querySelector(".range");

    // Add CSS transition for smooth image change
    volumecontrol.style.transition = "opacity 0.3s";

    volumecontrol.addEventListener('click', () => {
        console.log('volume control is clicked!');
        // Fade out
        volumecontrol.style.opacity = "0.3";
        setTimeout(() => {
            if (volumecontrol.src.includes("volume-loud.svg")) {
                volumecontrol.src = "imgs/volume-cross.svg";
                currentSong.volume = 0;
                rangeInput.value = 0;
            } else {
                volumecontrol.src = "imgs/volume-loud.svg";
                currentSong.volume = 0.5;
                rangeInput.value = 50;
            }
            // Fade in
            volumecontrol.style.opacity = "1";
        }, 200);
    });
    clickrange.addEventListener('click', () => {
        volumecontrol.src = "imgs/volume-loud.svg";
    });

    //eventlistener for previous and next
    previous.addEventListener('click', () => {
        console.log('previous is clicked!');

        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }

    });
    next.addEventListener('click', () => {
        console.log('next is clicked!');
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) > length) {
            playMusic(songs[index + 1]);

        }
    });

    //eventlistener for volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseFloat(e.target.value / 100)
    });

     
    //add eventlistener for search bar 
    document.querySelector(".searchbar").addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const songItems = document.querySelectorAll('.songs-list ul li');
        let found = false;
        songItems.forEach(li => {
            const songName = li.querySelector('.songname')?.innerText.toLowerCase() || '';
            if (songName.includes(query)) {
                li.style.display = '';
                found = true;
            } else {
                li.style.display = 'none';
            }
        });
        // Show "No results" if nothing matches
        let songul = document.querySelector('.songs-list ul');
        let noResultLi = songul.querySelector('.no-results');
        if (!found) {
            if (!noResultLi) {
                noResultLi = document.createElement('li');
                noResultLi.className = 'no-results';
                noResultLi.style.color = 'grey';
                noResultLi.innerText = 'No songs found';
                songul.appendChild(noResultLi);
            }
        } else if (noResultLi) {
            noResultLi.remove();
        }
    });


        // Search for albums (playlist folders)
    document.querySelector(".searchbarright").addEventListener('input', debounce((e) => {
        const query = e.target.value.toLowerCase();
        const albumCards = document.querySelectorAll('.spotify-playlist .cardContainer .card');
        let found = false;
        albumCards.forEach(card => {
            const albumTitle = card.querySelector('h2')?.innerText.toLowerCase() || '';
            if (albumTitle.includes(query)) {
                card.style.display = '';
                found = true;
            } else {
                card.style.display = 'none';
            }
        });

        // show a "No albums found" message
        let cardContainer = document.querySelector('.spotify-playlist .cardContainer');
        let noResultDiv = cardContainer.querySelector('.no-results');
        if (!found) {
            if (!noResultDiv) {
                noResultDiv = document.createElement('div');
                noResultDiv.className = 'no-results';
                noResultDiv.style.color = 'grey';
                noResultDiv.style.padding = '1em';
                noResultDiv.innerText = 'No albums found';
                cardContainer.appendChild(noResultDiv);
            }
        } else if (noResultDiv) {
            noResultDiv.remove();
        }
    }, 300));

    
   

}

main();
console.log('js loded successfully');

