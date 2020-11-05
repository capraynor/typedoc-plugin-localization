import { getAttributeType } from "../enums/json-keys";
import { Constants } from "../constants";

export abstract class BaseFactory {
    public name;
    protected fileClassContent;

    constructor(name) {
        this.name = name;
        this.fileClassContent = {};
    }

    public buildObjectStructure(data) {
        if (!this.fileClassContent[this.name]) {
            this.fileClassContent[this.name] = {};
        }

        if (data) {
            this.fileClassContent[this.name] = data;
        }
    }
    
    public appendAttribute(parentName, kind, attributeName, data, isStatic: boolean) {
        if (!data) {
            return;
        }        
        const attributeKind = getAttributeType(kind);

        if (isStatic){
            this.fileClassContent[parentName][attributeKind][Constants.STATIC_ATTRIBUTES_CATETORY_NAME] = this.fileClassContent[parentName][attributeKind][Constants.STATIC_ATTRIBUTES_CATETORY_NAME] || {};
            this.fileClassContent[parentName][attributeKind][Constants.STATIC_ATTRIBUTES_CATETORY_NAME][attributeName] = data;
        }else{
            this.fileClassContent[parentName][attributeKind] = this.fileClassContent[parentName][attributeKind] || {};
            this.fileClassContent[parentName][attributeKind][attributeName] = data;
        }

    }

    
    public abstract appendAccessorAttributes(parentName, kind, accessorName, accessorType, data);

    public isEmpty() {
        return !this.fileClassContent[this.name]['comment'];
    }

    public getJsonContent() {
        return this.fileClassContent;
    }
}