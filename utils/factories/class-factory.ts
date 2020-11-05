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
        const accessorTypeAsString = getAttributeType(accessorType);
        if(attributeKind === 'constructorSignature') {
            this.appendConstructorParameterAttributes(parentName,kind,accessorName,accessorType,data);
            return;
        }
        if(data['name'] && attributeKind === 'methods') {
            this.appendMethodParameterAttributes(parentName,kind,accessorName,accessorType,data);
            return;
        }
        this.fileClassContent[parentName][attributeKind] = this.fileClassContent[parentName][attributeKind] || {};
        const isAccessorExists = this.fileClassContent[parentName][attributeKind][accessorName];
        if (!isAccessorExists || typeof isAccessorExists == 'function') {
            this.fileClassContent[parentName][attributeKind][accessorName] = {};
        }
        this.fileClassContent[parentName][attributeKind][accessorName][accessorTypeAsString] = data;
    }

    public appendMethodParameterAttributes(parentName: string, kind: ReflectionKind, accessorName: string, accessorType, data) {
        const isCurrentExists = this.fileClassContent[parentName]["methods"][accessorName];
        if (!isCurrentExists) {
            this.fileClassContent[parentName]["methods"][accessorName] = {};
        }
        const isAttributeExists = this.fileClassContent[parentName]["methods"][accessorName]["comment"];
        if (!isAttributeExists) {
            this.fileClassContent[parentName]["methods"][accessorName]["comment"] = {};
        }
        const isParameterExists = this.fileClassContent[parentName]["methods"][accessorName]["comment"]["parameters"];
        if(!isParameterExists) {
            this.fileClassContent[parentName]["methods"][accessorName]["comment"]["parameters"] = {};
        }
        const isExists = this.fileClassContent[parentName]["methods"][accessorName]["comment"]["parameters"][data["name"]];
        if (!isExists) {
            this.fileClassContent[parentName]["methods"][accessorName]["comment"]["parameters"][data["name"]] = {};
        }
        this.fileClassContent[parentName]["methods"][accessorName]["comment"]["parameters"][data["name"]] = data["data"];
    }

    public appendConstructorParameterAttributes(parentName: string, kind: ReflectionKind, accessorName: string, accessorType, data) {
        const attributeKind = getAttributeType(kind);
        const currentName = accessorName;
        const isAttributeExists = this.fileClassContent[parentName]["methods"]["constructor"][attributeKind];
        if (!isAttributeExists) {
            this.fileClassContent[parentName]["methods"]["constructor"][attributeKind] = {};
        }
        const isParameterExists = this.fileClassContent[parentName]["methods"]["constructor"][attributeKind]["parameters"];
        if(!isParameterExists) {
            this.fileClassContent[parentName]["methods"]["constructor"][attributeKind]["parameters"] = {};
        }
        const isExists = this.fileClassContent[parentName]["methods"]["constructor"][attributeKind]["parameters"][currentName];
        if (!isExists) {
            this.fileClassContent[parentName]["methods"]["constructor"][attributeKind]["parameters"][currentName] = {};
        }
        this.fileClassContent[parentName]["methods"]["constructor"][attributeKind]["parameters"][currentName] = data;
    }

    public isEmpty() {
        return super.isEmpty() && 
            !Object.keys(this.fileClassContent[this.name][PROPERTIES_KEY]).length &&
            !Object.keys(this.fileClassContent[this.name][METHODS_KEY]).length &&
            !Object.keys(this.fileClassContent[this.name][ACCESSORS_KEY]).length;
    }
}