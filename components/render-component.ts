import * as path from 'path';

import { Component, RendererComponent } from 'typedoc/dist/lib/output/components';
import { ReflectionKind, ReflectionType } from 'typedoc/dist/lib/models';
import { FileOperations } from '../utils/file-operations';
import {  getAttributeType } from '../utils/enums/json-keys';
import { Constants } from '../utils/constants';
import { RendererEvent } from 'typedoc/dist/lib/output/events';
import { Parser } from '../utils/parser';
import { GlobalFuncs } from '../utils/global-funcs';

@Component({ name: 'render-component'})
export class RenderComponenet extends RendererComponent {
    fileOperations: FileOperations;
    /**
     * Contains data per every processed Object like (Class, Inteface, Enum) 
     */
    data: JSON;
    /**
     * Main process dir.
     */
    mainDirOfJsons: string;
    /**
     * JSON data for all global funcs definitions.
     */
    globalFuncsData;
    /**
     * String parser
     */
    parser: Parser;

    public initialize() {
        this.listenTo(this.owner, {
            [RendererEvent.BEGIN]: this.onRenderBegin,
        });
        
        this.fileOperations = new FileOperations(this.application.logger);
        this.parser = new Parser();
    }

    private onRenderBegin(event) {
        event.project.localization = this.application.options.getValue("localize");

        const reflections = event.project.reflections;
        const options = this.application.options.getRawValues();
        const localizeOpt = options[Constants.RENDER_OPTION];
        if (localizeOpt) {
            this.mainDirOfJsons = localizeOpt;
            this.globalFuncsData = this.fileOperations.getFileData(this.mainDirOfJsons, Constants.GLOBAL_FUNCS_FILE_NAME, 'json');
            this.runCommentReplacements(reflections);
        }
    }

    private runCommentReplacements(reflections) {
        const keys = Object.keys(reflections);
        keys.forEach(key => {
            const reflection = reflections[key];
            this.processTheReflection(reflection);
        });
    }

    private processTheReflection(reflection) {
        switch(reflection.kind) {
            case ReflectionKind.ExternalModule:
            case ReflectionKind.Module:
                if (!this.globalFuncsData) {
                    break;
                }
                let moduleData = this.getGlobalComment(reflection) || {};
                this.updateComment(reflection, moduleData);
                break;
            case ReflectionKind.Class:
            case ReflectionKind.Enum:
            case ReflectionKind.Interface:
            case ReflectionKind.TypeAlias:
                    const filePath = reflection.sources[0].fileName;
                    let processedDir = this.mainDirOfJsons;
                    const parsedPath = this.fileOperations.getProcessedDir(filePath);
                    if (parsedPath) {
                        processedDir = path.join(processedDir, parsedPath);
                    }
                    this.data = this.fileOperations.getFileData(processedDir, reflection.name, 'json');
                    if (this.data) {
                        this.updateComment(reflection, this.data[reflection.name]);
                    }
                break;
            case ReflectionKind.Property:
            case ReflectionKind.CallSignature:
            case ReflectionKind.EnumMember:
            case ReflectionKind.Event:
                   /**
                     * Skip reflections with type @ReflectionKind.Function because they are aslo @ReflectionKInd.CallSignature
                     * but the handling process here is not appropriate for them.
                     */
                    if (reflection.parent === ReflectionKind.Function) {
                        break;
                    }

                    const parent = this.getParentBasedOnType(reflection, reflection.kind);
                    const parentName = parent.name;
                    const attributeName = reflection.name;

                    const attributeData = this.getAttributeData(parentName, getAttributeType(reflection.kind), attributeName, reflection.flags.isStatic);
                    if(attributeData) {
                        this.updateComment(reflection, attributeData);
                    }
                break;
            case ReflectionKind.Function:
                    if (!this.globalFuncsData) {
                        break;
                    }
                    const funcData = this.getGlobalComment(reflection);
                    this.updateComment(reflection.signatures[0], funcData);
                break;
            case ReflectionKind.Variable: 
                if (!this.globalFuncsData) {
                    break;
                }

                if (GlobalFuncs.isTypeLiteralVariable(reflection)){
                    break;
                }
                const variableData = this.getGlobalComment(reflection);
                this.updateComment(reflection, variableData);
                break;
            case ReflectionKind.GetSignature:
            case ReflectionKind.SetSignature:
            case ReflectionKind.ConstructorSignature:
                    const accessorParent = this.getParentBasedOnType(reflection, reflection.kind);
                    const accessor = reflection.parent;
                    const accessorSignature = reflection.kind;
                    const data = this.getAccessorAttributeData(accessorParent.name, 
                                    getAttributeType(accessor.kind), 
                                    accessor.name, 
                                    getAttributeType(accessorSignature), 
                                    reflection.flags.isStatic);
                    if (data) {
                        this.updateComment(reflection, data);
                    }
                break;
            default:
                return;
        }
    }

    private getGlobalComment(reflection){
        let ref = reflection;
        let paths = [];
        do{
            paths.unshift(ref.name);
            ref = ref.parent;
        }while(ref.kind != ReflectionKind.Global);
        let p = paths.shift();
        let storage = this.globalFuncsData[p];
        while(storage && paths.length){
            storage = storage[paths.shift()];
        }
        return storage;
    }

    private getAttribute(parentName, attribute) {
        if (this.data && this.data[parentName]) {
            return this.data[parentName][attribute];
        }
    }

    private getAttributeData(parentName, attribute, attributeName, isStatic) {
        const data = this.getAttribute(parentName, attribute);

        if (data) {
            if (isStatic){
                if (data[Constants.STATIC_ATTRIBUTES_CATETORY_NAME]){
                    return data[Constants.STATIC_ATTRIBUTES_CATETORY_NAME][attributeName];
                }
            }

            return data[attributeName];
        }
    }

    private getAccessorAttributeData(parentName, attribute, attributeName, accessorType, isStatic) {
        const data = this.getAttributeData(parentName, attribute, attributeName, isStatic);
        if (data) {
            return data[accessorType];
        }
    }

    private updateComment(reflection, dataObj) {
        if (!dataObj){
            return;
        }
        
        if (!reflection){
            return;
        }
        if (!reflection.comment || !dataObj[Constants.COMMENT]) {
            return;
        }

        let parsed;
        if (reflection.comment.text) {
            parsed = this.parser.joinByCharacter(dataObj[Constants.COMMENT][Constants.TEXT], '\n');
            reflection.comment.text = parsed;
        }

        if (reflection.comment.shortText) {
            parsed = this.parser.joinByCharacter(dataObj[Constants.COMMENT][Constants.SHORT_TEXT], '\n');
            reflection.comment.shortText = parsed;
        }

        if (reflection.comment.returns) {
            parsed = this.parser.joinByCharacter(dataObj[Constants.COMMENT][Constants.RETURN], '\n');
            reflection.comment.returns = parsed;
        }

        if (reflection.comment.tags && dataObj[Constants.COMMENT][Constants.TAGS]) {
            reflection.comment.tags.forEach(tag => {
                const tagFromJson = dataObj[Constants.COMMENT][Constants.TAGS][tag.tagName];
                tag.tagName = tagFromJson[Constants.COMMENT].tagName;
                tag.text = this.parser.joinByCharacter(tagFromJson[Constants.COMMENT].text, '\n');
                return tag;
            });
        }

        if (reflection.parameters && dataObj[Constants.COMMENT][Constants.PARAMS]) {
            reflection.parameters.forEach(param => {
                const paramFromJson = dataObj[Constants.COMMENT][Constants.PARAMS][param.name];
                if (paramFromJson) {
                    param.comment.text = this.parser.joinByCharacter(paramFromJson[Constants.COMMENT].text, '\n');
                    param.comment.shortText = this.parser.joinByCharacter(paramFromJson[Constants.COMMENT].shortText, '\n');
                    param.comment.returns = this.parser.joinByCharacter(paramFromJson[Constants.COMMENT].return, '\n');
                    return param;
                }
            });
        }

        if (GlobalFuncs.isSupportedTypeAliasReflection(reflection)){
            this.updateTypeLiteralComment(reflection, dataObj)
        }
    }

    private updateTypeLiteralComment(reflection, dataObj){

                
        if (!reflection){
            return;
        }
        if (!reflection.comment || !dataObj[Constants.COMMENT]) {
            return;
        }


        let reflectionType = reflection.type as ReflectionType;
        reflectionType.declaration.children.forEach((c) => {
            let commentObj = dataObj.properties[c.name];

            if (!c.comment || !commentObj || !commentObj.comment){
                return;
            }

            c.comment.shortText = commentObj.comment.shortText || c.comment.shortText || "";
            c.comment.returns = commentObj.comment.return || c.comment.returns || "";
            c.comment.text = commentObj.comment.text || c.comment.text || "";
        });
    }

    /**
     * Returns the parent(Class, Interface, Enum) per every Method, Property, Getter, Setter etc.
     * @param reflection 
     * @param kind 
     */
    private getParentBasedOnType(reflection, kind) {
        if (kind === ReflectionKind.CallSignature || 
            kind === ReflectionKind.ConstructorSignature ||
            kind === ReflectionKind.GetSignature || 
            kind === ReflectionKind.SetSignature) {
                return reflection.parent.parent;
        }

        return reflection.parent;
    }
}
