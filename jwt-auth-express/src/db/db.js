import mongoose from "mongoose";

const ConnectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Database Connection Sucessfull !");
    } catch (error) {
        console.log("Database Connection Failed !");
        process.exit(1);
    }
};

export default ConnectDB;
