import { Logger } from "borgen";

// Implement any seeds for testing purposes but for us we just skip 
function seedDatabase() {
  Logger.info({ message: "Initializing database..." });
  try {
    return true;
  } catch (err) {
    Logger.error({ message: "Database initialization failed : " + err });
    return false;
  }
}

export default seedDatabase;



