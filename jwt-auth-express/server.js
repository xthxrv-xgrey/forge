import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import ConnectDB from "./src/db/db.js";

(async () => {
    try {
        await ConnectDB();
        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => {
            console.log(`Server is Running on PORT : ${PORT}`);
        });
    } catch (error) {
        console.log("Failed to run the app");
    }
})();
