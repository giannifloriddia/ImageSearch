/**
 * Represents a Picture object for displaying and processing image data.
 */
class Picture {
    /**
     * Creates a new Picture instance.
     * @param {number} px - X-coordinate of the picture.
     * @param {number} py - Y-coordinate of the picture.
     * @param {number} w - Width of the picture.
     * @param {number} h - Height of the picture.
     * @param {string} impath - Path to the image file.
     * @param {string} cat - Category of the picture.
     */
    constructor(px, py, w, h, impath, cat) {
        // Initialize picture properties
        this.posx = px; // X-coordinate of the top-left corner of the picture
        this.posy = py; // Y-coordinate of the top-left corner of the picture
        this.w = w;     // Width of the picture in pixels
        this.h = h;     // Height of the picture in pixels
        this.impath = impath; // Path to the image file
        this.imgobj = new Image(); // Creates an Image object to handle the picture's image
        this.imgobj.src = this.impath; // Set the image source to the given path
        this.original_w = this.imgobj.width; // Stores the original width of the image
        this.original_h = this.imgobj.height; // Stores the original height of the image
        this.category = cat; // Category for organizational or filtering purposes
        this.hist = []; // Histogram data for color analysis
    }

    /**
     * Draws the picture on a specified canvas.
     * @param {HTMLCanvasElement} cnv - The canvas element to draw on.
     */
    draw(cnv) {
        const ctx = cnv.getContext("2d"); // Get the drawing context of the canvas

        // Define the drawing function
        const draw = () => {
            ctx.drawImage(this.imgobj, this.posx, this.posy, this.w, this.h);
        };

        // Check if the image is already loaded
        if (this.imgobj.complete) {
            console.log("Draw >> N Time"); // Log repeated drawing attempts
            draw();
        } else {
            console.log("Draw >> First Time"); // Log the first drawing attempt
            this.imgobj.addEventListener('load', draw); // Wait for the image to load before drawing
        }
    }

    /**
     * Performs computations on the image and updates related data structures.
     * @param {HTMLCanvasElement} cnv - Canvas for processing the image.
     * @param {ColorHistogram} histcol - Instance of ColorHistogram for histogram calculations.
     * @param {Event} eventP - Event to dispatch after computations are complete.
     */
    computation(cnv, histcol, eventP) {
        const ctx = cnv.getContext("2d");

        // Define the computation logic
        const compute = () => {
            // Draw the full-size image on the canvas for pixel access
            ctx.drawImage(this.imgobj, 0, 0, this.imgobj.width, this.imgobj.height);

            // Extract image pixel data
            const pixels = ctx.getImageData(0, 0, this.imgobj.width, this.imgobj.height);

            // Calculate histogram data using the provided ColorHistogram instance
            this.hist = histcol.countPixels(pixels);
            console.log("Histogram: ", this.hist);

            // Display histogram data on the canvas
            //this.displayHistogram(cnv, this.hist, histcol.redColor, histcol.greenColor, histcol.blueColor);

            // Dispatch the provided event to signal completion
            document.dispatchEvent(eventP);
        };

        // Check if the image is already loaded
        if (this.imgobj.complete) {
            console.log("Computation >> N Time");
            compute();
        } else {
            console.log("Computation >> First Time");
            this.imgobj.addEventListener('load', compute);
        }
    }

    /**
     * Displays the histogram data on the canvas.
     * @param {HTMLCanvasElement} cnv - Canvas for displaying histogram data.
     * @param {number[]} hist - Histogram data array.
     * @param {number[]} redColor - Array of red color components.
     * @param {number[]} greenColor - Array of green color components.
     * @param {number[]} blueColor - Array of blue color components.
     */
    displayHistogram(cnv, hist, redColor, greenColor, blueColor) {
        const ctx = cnv.getContext("2d", { willReadFrequently: true });
        const text_y = 390; // Y-coordinate for text display
        const rect_y = 400; // Y-coordinate for color rectangles
        const hor_space = 80; // Horizontal space between elements

        // Display each color and corresponding pixel count
        ctx.font = "12px Arial";
        for (let c = 0; c < redColor.length; c++) {
            ctx.fillStyle = `rgb(${redColor[c]}, ${greenColor[c]}, ${blueColor[c]})`;
            ctx.fillRect(c * hor_space, rect_y, 50, 50); // Draw color rectangle
            if (c === 8) {
                ctx.fillStyle = "black"; // Use black for contrast
            }
            ctx.fillText(hist[c], c * hor_space, text_y); // Display pixel count
        }
    }

    /**
     * Sets the position of the picture on the canvas.
     * @param {number} px - New X-coordinate for the picture.
     * @param {number} py - New Y-coordinate for the picture.
     */
    setPosition(px, py) {
        this.posx = px;
        this.posy = py;
    }

    /**
     * Determines if the mouse cursor is over the picture.
     * @param {number} mx - X-coordinate of the mouse cursor.
     * @param {number} my - Y-coordinate of the mouse cursor.
     * @returns {boolean} True if the cursor is over the picture, false otherwise.
     */
    mouseOver(mx, my) {
        return (
            mx >= this.posx &&
            mx <= this.posx + this.w &&
            my >= this.posy &&
            my <= this.posy + this.h
        );
    }
}

// Represents a ColorHistogram object that processes and analyzes color data in an image
class ColorHistogram {
    /**
     * Creates a new ColorHistogram instance.
     * @param {number[]} redColor - Array of red channel values.
     * @param {number[]} greenColor - Array of green channel values.
     * @param {number[]} blueColor - Array of blue channel values.
     */
    constructor(redColor, greenColor, blueColor) {
        this.redColor = redColor; // Red channel data
        this.greenColor = greenColor; // Green channel data
        this.blueColor = blueColor; // Blue channel data
        // Combine the individual color channels into an array of [R, G, B] triplets
        this.colors = this.redColor.map((_, i) => [this.redColor[i], this.greenColor[i], this.blueColor[i]]);
    }

    /**
     * Counts the number of pixels corresponding to defined color categories.
     * @param {ImageData} pixels - Image data containing the color information for the image.
     * @returns {number[]} - Histogram data representing pixel counts for each color category.
     */
    countPixels(pixels) {
        const hist = new Array(12).fill(0); // Initialize histogram with 12 bins, set to zero
        const data = pixels.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            let closestIndex = 0;
            let minDistance = Infinity;

            for (let j = 0; j < this.colors.length; j++) {
                const [cr, cg, cb] = this.colors[j];
                const distance = Math.abs(r - cr) + Math.abs(g - cg) + Math.abs(b - cb);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = j;
                }
            }

            hist[closestIndex]++;
        }

        return hist; // Return the histogram data
    }
}

export { Picture, ColorHistogram}