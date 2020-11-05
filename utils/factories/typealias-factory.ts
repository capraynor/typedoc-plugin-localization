import { AttributeType } from "../enums/json-keys";
import { BaseFactory } from "./base-factory";

const PROPERTIES_KEY = AttributeType[AttributeType.properties];
const METHODS_KEY = AttributeType[AttributeType.methods];

export class TypeAliasFactory extends BaseFactory {
    constructor(name) {
        super(name);
    }
    
    public buildObjectStructure(data) {
        super.buildObjectStructure(data);

        if (data) {
            this.fileClassContent[this.name][PROPERTIES_KEY] = data[PROPERTIES_KEY];
            this.fileClassContent[this.name][METHODS_KEY] = data[METHODS_KEY];
        } else {
            this.fileClassContent[this.name][PROPERTIES_KEY] = {};
            this.fileClassContent[this.name][METHODS_KEY] = {};
        }
    }
    
    public isEmpty() {
        return super.isEmpty() &&
        !Object.keys(this.fileClassContent[this.name][PROPERTIES_KEY]).length &&
        !Object.keys(this.fileClassContent[this.name][METHODS_KEY]).length;
    }
    public appendAccessorAttributes(parentName: any, kind: any, accessorName: any, accessorType: any, data: any) { }
}