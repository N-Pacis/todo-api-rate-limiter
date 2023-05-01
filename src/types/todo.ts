import { Model } from 'sequelize';

export class Todo extends Model{
    public id!: string;
    public title!:string;
    public description?:string;
    public created_by!:string;
    public created_at?:Date;
    public updated_at?:Date;
    [key: number]: any;
    [key: symbol]: any;
}
