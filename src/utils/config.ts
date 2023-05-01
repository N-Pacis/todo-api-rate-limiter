import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '../../.env') });

export let db_host:string;
export let db_name:string;
export let db_user:string;
export let db_password:string;

if(process.env.ENV == "DEV"){
    db_host = String(process.env.DEV_DB_HOST);
    db_name = String(process.env.DEV_DB_NAME);
    db_user = String(process.env.DEV_DB_USER);
    db_password = String(process.env.DEV_DB_PASSWORD);
}
else{
    db_host = String(process.env.PROD_DB_HOST);
    db_name = String(process.env.PROD_DB_NAME);
    db_user = String(process.env.PROD_DB_USER);
    db_password = String(process.env.PROD_DB_PASSWORD);
}
