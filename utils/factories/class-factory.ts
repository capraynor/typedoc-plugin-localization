import { BaseFactory } from './base-factory';
import { AttributeType, getAttributeType } from '../enums/json-keys';
import { ReflectionKind } from 'typedoc/dist/lib/models';

const PROPERTIES_KEY = AttributeType[AttributeType.properties];
const METHODS_KEY = AttributeType[AttributeType.methods];
const ACCESSORS_KEY = AttributeType[AttributeType.accessors];

export class ClassFactory extends BaseFactory {

    constructor(name: string) {
        super(name);
    }

    public buildObjectStructure(data) {
        super.buildObjectStructure(data);

        this.fileClassContent[this.name][PROPERTIES_KEY] = {};
        this.fileClassContent[this.name][METHODS_KEY] = {};
        this.fileClassContent[this.name][ACCESSORS_KEY] = {};
    }

    public appendAccessorAttributes(parentName: string, kind: ReflectionKind, accessorName: string, accessorType, data) {
        if(!data) {
            return;
        }

        const attributeKind = getAttributeType(kind);
        const accesorTypeAsString = getAttributeType(accessorType);
        const isAccessorExists = this.fileClassContent[parentName][attributeKind][accessorName];
        if (!isAccessorExists || typeof isAccessorExists == 'function') {
            this.fileClassContent[parentName][attributeKind][accessorName] = {};
        }
        this.fileClassContent[parentName][attributeKind][accessorName][accesorTypeAsString] = data;
    }

    public isEmpty() {
        return super.isEmpty() && 
            !Object.keys(this.fileClassContent[this.name][PROPERTIES_KEY]).length &&
            !Object.keys(this.fileClassContent[this.name][METHODS_KEY]).length &&
            !Object.keys(this.fileClassContent[this.name][ACCESSORS_KEY]).length;
    }
}