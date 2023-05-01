import { Model } from 'sequelize';

export class User extends Model{
    public id!: string;
    public names?:string;
    public email!:string;
    public password!:string;
    public created_at!:Date;
    public updated_at!:Date;
    [key: number]: any;
    [key: symbol]: any;
}
