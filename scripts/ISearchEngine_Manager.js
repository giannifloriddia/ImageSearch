/**
 * @fileoverview Main entry point of the ISearchEngine application.
 * This script initializes the application with a specified database
 * and a canvas element from the DOM, and it provides a global reference
 * to the ISearchEngine instance for debugging purposes.
 */

import { ISearchEngine } from "./ISearchEngine.js";

// Global variable to hold the application instance
let app = null;

/**
 * Main function to initialize the ISearchEngine application.
 * 
 * @function main
 */
function main() {
    // Get the canvas element from the DOM by its ID
    const canvas = document.getElementById("canvas");

    // Create an instance of ISearchEngine with a reference to the database file
    app = new ISearchEngine("database.json");

    /**
     * Exposing the application instance globally for debugging purposes.
     * 
     * WARNING: Avoid exposing sensitive objects or data globally in production
     * environments as it can pose security risks.
     */
    window.app = app;

    // Initialize the ISearchEngine application with the canvas element
    app.init(canvas).then(() => {
        // Log a success message once the initialization process is complete
        console.log("ISearchEngine Database Initialized...");
        // TODO: Add further application logic or UI updates here if required.
    }).catch(error => {
        // Handle potential errors during the initialization process
        console.error("Error initializing ISearchEngine:", error);
    });

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
}

function updateCanvasSize() {
    const cnv = document.getElementById('canvas');
    cnv.width = document.body.clientWidth;

    const objCnv = document.getElementById('objects');
    app.gridView(cnv);
}

const clickSound = document.getElementById('click-sound');

function playClickSound() {
    clickSound.currentTime = 0;
    clickSound.play();
}

document.getElementById('button-search').addEventListener('click', playClickSound);

document.querySelectorAll('.dominant-box, .color-box').forEach(box => {
    box.addEventListener('click', playClickSound);
});

document.getElementById("button-search").addEventListener("click", processar);
function processar(){
    const pesquisa = document.getElementById("input-search").value.toString();
    app.searchKeywords(pesquisa);
}

document.querySelectorAll('.color-box').forEach(box => {
    box.addEventListener('click', () => {
        const pesquisa = document.getElementById("input-search").value.toString();
        let color = box.dataset.color.toString();
        app.searchColor(pesquisa, color);
    });
});

document.querySelectorAll('.dominant-box').forEach(box => {
    box.addEventListener('click', () => {
        app.searchKeywords(box.dataset.color);
    });
});

const radioButtons = document.querySelectorAll('.radio input[type="radio"]');
radioButtons.forEach(radio => {
    radio.addEventListener('click', (event) => {
        const searchInput = document.getElementById('input-search');
        searchInput.value = radio.nextElementSibling.textContent.trim();
        app.searchKeywords(searchInput.value);
    });
});

document.addEventListener("DOMContentLoaded", function () {
    let audio = document.getElementById("background-audio");

    // Seleciona o áudio existente ou cria um novo
    if (!audio) {
        audio = document.createElement("audio");
        audio.id = "background-audio";
        audio.src = "audio/Vivaldi - Spring.mp3"; // Caminho para o arquivo de áudio
        audio.loop = true;
        audio.autoplay = true;
        audio.style.display = "none"; // Oculta o player
        audio.volume = 0.05;
        document.body.appendChild(audio);
    }

    // Inicializa o estado com base no áudio
    let isPlaying = true;

    // Função para alternar entre Play e Pause
    const togglePlay = () => {
        if (isPlaying) {
            audio.pause(); // Pausa o áudio
        } else {
            audio.play().catch((error) => {
                console.error("Erro ao tocar o áudio:", error);
            });
        }
        isPlaying = !isPlaying; // Atualiza o estado
    };
    // Configura o botão de Play/Stop
    const playButton = document.getElementById("play-button");
    playButton.addEventListener("click", togglePlay);
});


// Invoke the main function to start the application
main();
