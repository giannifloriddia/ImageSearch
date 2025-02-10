import {DatabaseJSON, LocalStorageDatabaseJSON} from "./Database.js";
import {ColorHistogram, Picture} from "./Image_Processing.js";

/**
 * Represents an Image Search Engine.
 */
class ISearchEngine {
    /**
     * Constructs an ISearchEngine instance.
     * @param {string} dbase - The path to the JSON database file.
     */
    constructor(dbase) {
        // Pool for all pictures, initialized with a size of 5000
        this.allpictures = new Pool(5000);

        // Color information for color histogram
        this.colors = ["red", "orange", "yellow", "green", "Blue-green", "blue", "purple", "pink", "white", "grey", "black", "brown"];
        // Color components for Red, Green, Blue in each color
        this.redColor = [204, 251, 255, 0, 3, 0, 118, 255, 255, 153, 0, 136];
        this.greenColor = [0, 148, 255, 204, 192, 0, 44, 152, 255, 153, 0, 84];
        this.blueColor = [0, 11, 0, 0, 198, 255, 167, 191, 255, 153, 0, 24];

        // Categories for classification used in the search
        this.categories = ["burj khalifa",
            "chichen itza",
            "christ the reedemer",
            "eiffel tower",
            "great wall of china",
            "machu pichu",
            "pyramids of giza",
            "roman colosseum",
            "statue of liberty",
            "stonehenge",
            "taj mahal",
            "venezuela angel falls"];

        // Database and JSON file information
        this.jsonFile = dbase;
        this.db = new DatabaseJSON(); // Instance of the DatabaseJSON class
        this.lsDb = new LocalStorageDatabaseJSON(); // Instance of the LocalStorageDatabaseJSON class


        // Number of images to show in canvas as a search result
        this.numShownPic = 30;

        // Image dimensions for rendering
        this.imgWidth = 190;
        this.imgHeight = 140;

        // Reference to the canvas for rendering images
        this.viewCanvas = null;

        // Canvas used for image processing (invisible to the user)
        this.processingCanvas = document.createElement("canvas");
        this.processingCanvas.width = 1920;
        this.processingCanvas.height = 1080;

        this.results = [];
        this.lastHoverIndex = -1;
    }

    /**
     * Initializes the Image Search Engine.
     * @param {HTMLCanvasElement} cnv - The canvas element for image rendering.
     * @returns {Promise<void>} - A promise that resolves when initialization is complete.
     */
    async init(cnv) {
        this.viewCanvas = cnv; // Set the reference for the canvas

        // Load the JSON data from the file
        this.jsonData = await this.db.loadFile(this.jsonFile);
        console.log(this.jsonData); // Log the loaded data

        if (this.lsDb.isEmpty()) {
            this.databaseProcessing(this.processingCanvas);
        }

        // Adiciona o event listener para detetar o hover
        this.viewCanvas.addEventListener("mousemove", (event) => {
            this.handleHover(event);
        });

    }

    /**
     * Processes the image database for color histogram and color moments.
     * @param {HTMLCanvasElement} cnv - The canvas element for image processing.
     */
    databaseProcessing(cnv) {
        // Image processing classes
        const h12color = new ColorHistogram(this.redColor, this.greenColor, this.blueColor); // Histogram processing

        for (const imageData of this.jsonData.images) {
            let img = new Picture(0, 0, 100, 100, imageData.path, imageData.class);

            // Create an event name for when the image is processed
            const eventname = "processed_picture_" + img.impath;
            const eventP = new Event(eventname);

            // Listen for the "processed_picture_" event and call imageProcessed when it's fired
            document.addEventListener(eventname, () => {
                this.imageProcessed(img, eventname);
            });

            // Start processing the image with the provided canvas and processing classes
            img.computation(cnv, h12color, eventP);

        }
    }

    /**
     * Handles the image processed event.
     * @param {Picture} img - The processed image.
     * @param {string} eventname - The event name.
     */
    imageProcessed(img, eventname) {
        // When the image is processed, this method is called to check if all images are processed.
        // If all images are processed, save the processed data to localStorage for future queries.

        if (this.lsDb.isEmpty()){
            this.allpictures.insert(img); // Insert the processed image into the pool
            console.log("Event:\n" + eventname + "Histogram:\n", img.hist, "\nColor Moments:", img.color_moments); // Log the results

            document.getElementById("processing-info").textContent =
                "Image " + this.allpictures.stuff.length + " processed out of " + 1200;

            // Check if all images are processed
            if (this.allpictures.stuff.length >= this.jsonData.images.length) {
                console.log("All Images Processed");
                document.getElementById("processing-info").textContent = "All Images Processed";
                this.createColorDatabaseLS();
                //this.createIExampledatabaseLS();
            }
        }
    }


    /**
     * Creates the color database in Local Storage.
     * This method creates the color query database in localStorage by saving
     * the images grouped or indexed by their dominant colors.
     */
    createColorDatabaseLS() {
        console.log("Create Color Database");
        const imagesByCategory = {};
        this.allpictures.stuff.forEach(picture => {
            if (!imagesByCategory[picture.category])
                imagesByCategory[picture.category] = [];
            imagesByCategory[picture.category].push(picture);
        });
        console.log("Images by Category", imagesByCategory);

        const colorDatabase = {};
        this.categories.forEach(category => {
            colorDatabase[category] = {images: []};
            this.colors.forEach((color, i) => {
                console.log(imagesByCategory[category]);
                this.sortbyColor(i, imagesByCategory[category]);
                colorDatabase[category].images.push(
                    ...imagesByCategory[category].slice(0, this.numShownPic).map(img => ({class: color, image: img}))
                )
            })
        })

        for (const category in colorDatabase) {
            this.lsDb.save(category, colorDatabase[category]);
        }
        console.log("Color Database", colorDatabase);
    }

    /**
     * Searches images based on a selected color.
     * @param {string} category - The category to search within.
     * @param {string} color - The selected color.
     */
    searchColor(category, color) {

        let results = [];

        if (category === "") {
            console.log("Searching by Color:", color);

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const categoryData = this.lsDb.read(key);

                if (categoryData && categoryData.images) {
                    const filteredImages = categoryData.images
                        .filter(im => im.class === color) // Filtra pela cor
                        .map(im => im.image.impath); // Extrai o caminho da imagem
                    results.push(...filteredImages.slice(0, 3));
                }
            }
        } else {
            console.log("Searching by: ", category, " and Color:", color);
            results = this.lsDb.read(category).images.filter(im => im.class === color).map(im => im.image.impath);
        }

        this.results = results;
        console.log("RESULTADOS: ", this.results);
        this.gridView(this.viewCanvas);

    }

    /**
     * Searches images based on keywords.
     * @param {string} category - The category to search within.
     */
    searchKeywords(category) {
        this.results = app.db.search(category, app.jsonData, this.numShownPic);
        this.gridView(this.viewCanvas);
    }

    /**
     * Sorts a list of images based on the number of pixels of a selected color.
     * @param {number} idxColor - The index of the color in the color array.
     * @param {Picture[]} list - The list of images to be sorted.
     * This method sorts the list of images based on the number of pixels in a specific color,
     * as determined by the histogram at the index `idxColor`.
     * The images with the most pixels of the selected color appear first in the sorted list.
     */
    sortbyColor(idxColor, list) {
        // Method to sort images according to the number of pixels of a selected color
        list.sort(function (a, b) {
            return b.hist[idxColor] - a.hist[idxColor]; // Sort by the color count in the histogram
        });
    }

    /**
     * Displays images in a grid view on a specified canvas.
     * @param {HTMLCanvasElement} canvas - The canvas element for rendering the grid view.
     * This method arranges the images in a grid on the canvas. The number of images per row
     * and the layout of the grid should be determined dynamically, depending on the size of the canvas.
     * It will draw the images in their corresponding positions, creating a visual grid of images.
     */
    gridView(canvas) {

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const numImagesPerRow = Math.floor(canvas.width / this.imgWidth);
        const horizontalSpacing = (canvas.width - (numImagesPerRow * this.imgWidth)) / (numImagesPerRow + 1);
        const verticalSpacing = 10; // Example spacing between rows

        this.results.forEach((impath, index) => {
            const pictureElement = new Picture(index * 100, 0, 0, 100, impath, "results");
            const row = Math.floor(index / numImagesPerRow);
            const col = index % numImagesPerRow;
            const x = col * this.imgWidth + horizontalSpacing * (col + 1);
            const y = row * (this.imgHeight + verticalSpacing);

            const imgElement = new Image();
            imgElement.src = pictureElement.impath;
            imgElement.onload = () => {
                ctx.drawImage(imgElement, x, y, this.imgWidth, this.imgHeight);
            };
        })
    }

    /**
     * Handles the hover effect when the mouse moves over an image.
     * @param {MouseEvent} event - The mouse event.
     */
    handleHover(event) {
        const rect = this.viewCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const ctx = this.viewCanvas.getContext('2d');

        // Variáveis para evitar redesenhos desnecessários
        let hoverIndex = -1;
        const numImagesPerRow = Math.floor(this.viewCanvas.width / this.imgWidth);
        const horizontalSpacing = (this.viewCanvas.width - (numImagesPerRow * this.imgWidth)) / (numImagesPerRow + 1);
        const verticalSpacing = 10;

        // Iterar pelas imagens para verificar qual está a ser "hovered"
        this.results.forEach((impath, index) => {
            const row = Math.floor(index / numImagesPerRow);
            const col = index % numImagesPerRow;
            const x = col * this.imgWidth + horizontalSpacing * (col + 1);
            const y = row * (this.imgHeight + verticalSpacing);

            const isHovering = mouseX >= x && mouseX <= x + this.imgWidth &&
                mouseY >= y && mouseY <= y + this.imgHeight;

            if (isHovering) {
                hoverIndex = index; // Guarda o índice da imagem "hovered"
            }
        });

        // Redesenhar apenas se houver mudança no "hoverIndex"
        if (this.lastHoverIndex !== hoverIndex) {
            this.lastHoverIndex = hoverIndex;

            // Limpar e redesenhar todo o canvas
            ctx.clearRect(0, 0, this.viewCanvas.width, this.viewCanvas.height);

            this.results.forEach((impath, index) => {
                const row = Math.floor(index / numImagesPerRow);
                const col = index % numImagesPerRow;
                const x = col * this.imgWidth + horizontalSpacing * (col + 1);
                const y = row * (this.imgHeight + verticalSpacing);

                const imgElement = new Image();
                imgElement.src = impath;

                imgElement.onload = () => {
                    if (index === hoverIndex) {
                        // Desenha a imagem maior (hover)
                        const scale = 1.1; // Escala de 110%
                        const scaledWidth = this.imgWidth * scale;
                        const scaledHeight = this.imgHeight * scale;
                        const offsetX = (scaledWidth - this.imgWidth) / 2;
                        const offsetY = (scaledHeight - this.imgHeight) / 2;
                        ctx.drawImage(imgElement, x - offsetX, y - offsetY, scaledWidth, scaledHeight);
                    } else {
                        // Desenha a imagem normal
                        ctx.drawImage(imgElement, x, y, this.imgWidth, this.imgHeight);
                    }
                };
            });
        }
    }
}

/**
 * Represents a Pool that manages a collection of objects.
 * This class allows inserting, removing, and emptying objects from the pool,
 * ensuring that the pool does not exceed its maximum capacity.
 */
class Pool {
    /**
     * Constructs a Pool instance with a specified maximum size.
     * @param {number} maxSize - The maximum size of the pool.
     * The pool will not accept more objects than this limit.
     */
    constructor(maxSize) {
        this.size = maxSize; // Maximum size of the pool, limits the number of objects
        this.stuff = []; // Collection of objects currently stored in the pool
    }

    /**
     * Inserts an object into the pool if there is available space.
     * If the pool is full, it alerts the user that no more objects can be added.
     * @param {*} obj - The object to be inserted into the pool.
     */
    insert(obj) {
        if (this.stuff.length < this.size) {
            this.stuff.push(obj); // Insert the object into the pool if space is available
        } else {
            alert("The application is full: there isn't more memory space to include objects");
            // Alert the user if the pool has reached its maximum capacity
        }
    }

    /**
     * Removes an object from the pool if there are objects present.
     * If the pool is empty, it alerts the user that there are no objects to remove.
     */
    remove() {
        if (this.stuff.length !== 0) {
            this.stuff.pop(); // Remove the last object added to the pool
        } else {
            alert("There aren't objects in the application to delete");
            // Alert the user if the pool is empty and there are no objects to remove
        }
    }

    /**
     * Empties the entire pool by removing all objects.
     * This method repeatedly calls remove() until the pool is empty.
     */
    emptyPool() {
        while (this.stuff.length > 0) {
            this.remove(); // Remove objects until the pool is empty
        }
    }
}

export {ISearchEngine, Pool}
