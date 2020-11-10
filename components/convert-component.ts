import { Component, ConverterComponent } from 'typedoc/dist/lib/converter/components';
import { Converter } from 'typedoc/dist/lib/converter';
import { ReflectionKind, DeclarationReflection, ReflectionType, Reflection } from 'typedoc/dist/lib/models';
import { FileOperations } from '../utils/file-operations';
import { ClassFactory } from '../utils/factories/class-factory';
import { BaseFactory } from '../utils/factories/base-factory';
import { EnumFactory } from '../utils/factories/enum-factory';
import { Parser } from '../utils/parser';
import { Constants } from '../utils/constants';
import { InterfaceFactory } from '../utils/factories/interface-factory';
import { FunctionFactory } from '../utils/factories/function-factory';
import { VariableFactory } from '../utils/factories/variable-factory';
import { TypeAliasFactory } from '../utils/factories/typealias-factory';
import { TypeLiteralFactory } from '../utils/factories/typeliteral-factory';
import { AttributeType } from '../utils/enums/json-keys';
import { GlobalFuncs } from '../utils/global-funcs';

const PROPERTIES_KEY = AttributeType[AttributeType.properties];
  
@Component({ name: 'convert-component' })
export class ConvertComponent extends ConverterComponent {
    /**
     * Contains current name per every Class, Interface, Enum.
     */
    private _jsonObjectName: string;
    public get jsonObjectName(): string {
        return this._jsonObjectName;
    }
    public set jsonObjectName(value: string) {
        this._jsonObjectName = value;
    }
    /**
     * Contains current Object instance.
     */
    private _factoryInstance: BaseFactory;
    public get factoryInstance(): BaseFactory {
        return this._factoryInstance;
    }
    public set factoryInstance(value: BaseFactory) {
        this._factoryInstance = value;
    }
    fileOperations: FileOperations;
    /**
     * Current @Reflection instance.
     */
    reflection;
    parser: Parser;
    /**
     * Main process dir
     */
    mainDirToExport: string;
    /**
     * Global functions data.
     */
    globalFuncsJson = {};

    public initialize() {

        this.listenTo(this.owner, {
            [Converter.EVENT_RESOLVE]: this.resolve,
            [Converter.EVENT_RESOLVE_BEGIN]: this.onResolveBegin,
            [Converter.EVENT_RESOLVE_END]: this.onResolveEnd,
            [Converter.EVENT_END]: this.onEnd,
            [Converter.EVENT_BEGIN]: this.onBegin
        });

        this.parser = new Parser();
        this.fileOperations = new FileOperations(this.application.logger);
    }

    
    isReflectionHidden(reflection: Reflection){
        do {
            if (reflection?.comment?.hasTag("hidden")){
                return true;
            }
        }while(!!(reflection = reflection.parent))

        return false;
    }

    /**
     * Executes when the file convertion begins.
     */
    private onBegin() {
        /**
         * Command line arguments
         */
        const options = this.application.options.getRawValues();
        /**
         * Get json's directory. Where json files should be exported.
         */
        this.mainDirToExport = options[Constants.CONVERT_OPTION];

        if(!this.fileOperations.ifDirectoryExists(this.mainDirToExport)) {
            this.fileOperations.createDir(this.mainDirToExport);
        }
    }

    /**
     * Execute when the convertion of the files end.
     */
    private onEnd() {
        /**
         * Stop the process after all json's are created.
         * 
         * It isn't necessary to continue execution because json's have to be translated first
         * then execute the generation of the documentation.
         */
        process.exit(0);
    }


    private onResolveBegin(context) {
        const files = context.project.files;
        /**
         * Creates the directory structure of the json's generetion.
         */
        this.fileOperations.prepareOutputDirectory(this.mainDirToExport, files);
        /**
         * Create main file which would contains all global functions.
         */
        this.fileOperations.createFile(this.mainDirToExport, null, Constants.GLOBAL_FUNCS_FILE_NAME, 'json');
        this.fileOperations.appendFileData(this.mainDirToExport, null, Constants.GLOBAL_FUNCS_FILE_NAME, 'json', {});
    }

    private onResolveEnd(...rest) {
        /**
         * Write the last built json file.
         * 
         * It happens here because we are unable to track into the 
         * @reslove handler when exactly the execution stops.
         * And we know for sure that the last step before stropping the conversion is here.
         */
        if (this.factoryInstance && !this.factoryInstance.isEmpty()) {
            const filePath = this.reflection.sources[0].fileName;
            this.fileOperations.appendFileData(this.mainDirToExport, filePath, this.jsonObjectName, 'json', this.factoryInstance.getJsonContent());
        }

        /**
         * Write all collected data for all global functions into corresponding file. 
         */ 
        const funcObjKeys = Object.keys(this.globalFuncsJson);
        if (funcObjKeys.length) {
            this.fileOperations.appendFileData(this.mainDirToExport, null, Constants.GLOBAL_FUNCS_FILE_NAME, 'json', this.globalFuncsJson);
        }
    }

    /**
     * Triggers per every reflection object.
     * @param context 
     * @param reflection 
     */
    private resolve(context, reflection) {
        if (this.isReflectionHidden(reflection)){
            return;
        }

        switch(reflection.kind) {
            case ReflectionKind.Module:
                const moduleData = this.getCommentInfo(reflection);
                let storage = this.prepareStorage(reflection);
                Object.assign(storage, moduleData);
            break;
            case ReflectionKind.Enum:
            case ReflectionKind.Class:
            case ReflectionKind.Interface:
            case ReflectionKind.TypeAlias: 
                /**
                 * Writes file content when the resolve process for to Object ends 
                 * per(Class, Enum, Interface).
                 */

                if (this.jsonObjectName !== reflection.name && this.jsonObjectName !== undefined) {
                    if (!this.factoryInstance.isEmpty()) {
                        const filePath = this.reflection.sources[0].fileName;
                        this.fileOperations.appendFileData(this.mainDirToExport, filePath, this.jsonObjectName, 'json', this.factoryInstance.getJsonContent());
                    }
                }
                const data = this.getCommentInfo(reflection);
                this.jsonObjectName = reflection.name;
                this.reflection = reflection;
                this.factoryInstance = this.instanceBuilder(reflection.kind, reflection.name);
                this.factoryInstance.buildObjectStructure(data);
                break;
            case ReflectionKind.Property:
            case ReflectionKind.CallSignature:
            case ReflectionKind.EnumMember:
            case ReflectionKind.Method:
           
                /**
                 * Skip reflections with type @ReflectionKind.Function because they are aslo @ReflectionKInd.CallSignature
                 * but the handling process here is not appropriate for them.
                 */
                if (reflection.parent.kind === ReflectionKind.Function) {
                    break;
                }

                const getData = this.getCommentInfo(reflection);
                this.factoryInstance.appendProperties(this.jsonObjectName, reflection.kind, reflection.name, getData, reflection.flags.isStatic);
                break;
            case ReflectionKind.Function:
                    const funcData = this.getCommentInfo(reflection.signatures[0]);
                    const funcInstance = this.instanceBuilder(reflection.kind, reflection.name);
                    funcInstance.buildObjectStructure(funcData);
                    if (!funcInstance.isEmpty()) {
                        let storage = this.prepareStorage(reflection);
                        Object.assign(storage, funcInstance.getJsonContent());
                    }
                break;
            case ReflectionKind.Variable: 

                    if (GlobalFuncs.isTypeLiteralVariable(reflection)){
                        break;
                    }
                    const variableData = this.getCommentInfo(reflection);
                    const variableInstance = this.instanceBuilder(reflection.kind, reflection.name);
                    variableInstance.buildObjectStructure(variableData);
                    if (!variableInstance.isEmpty()){
                        let storage = this.prepareStorage(reflection);
                        Object.assign(storage, variableInstance.getJsonContent());
                    }
                break;
            case ReflectionKind.Parameter:
                if(reflection.parent.kind === ReflectionKind.ConstructorSignature) {
                    const data = this.getCommentInfo(reflection);
                    this.factoryInstance.appendParameters(this.jsonObjectName, reflection.parent.kind, reflection.name, reflection.type, data);
                }
                if(reflection.parent.kind === ReflectionKind.CallSignature) {
                    const accessorName = reflection.parent.name;
                    const accessorType = reflection.parent.kind;
                    const accessorData = this.getCommentInfo(reflection);
                    const accessorDataWithName = {"name":reflection.name,"data":accessorData};
                    this.factoryInstance.appendParameters(this.jsonObjectName, reflection.parent.kind, accessorName, accessorType, accessorDataWithName);
                }
                break;
            case ReflectionKind.Accessor:
            case ReflectionKind.GetSignature:
            case ReflectionKind.SetSignature:
            case ReflectionKind.ConstructorSignature:
                const accessorName = reflection.parent.name;
                const accessorType = reflection.kind;
                const accessorData = this.getCommentInfo(reflection);
                this.factoryInstance.appendParameters(this.jsonObjectName, reflection.parent.kind, accessorName, accessorType, accessorData);
            default:
                return;
        }
    }

    private prepareStorage(reflection){
        let paths = [];
        let ref: Reflection;
        if (reflection.kind === ReflectionKind.Module){
            ref = reflection
        }else{
            ref = reflection.parent;
        }
        
        do{
            paths.unshift(ref.name);
            ref = ref.parent;
        }while(ref && ref.kind != ReflectionKind.Global);

        let obj = this.globalFuncsJson;
        paths.forEach(p => {
            if(!obj[p]){
                obj[p] = {};
            }
            obj = obj[p];
        });
        return obj;
    }

    /**
     * Returns all comment info including tags and parameters.
     * @param reflection 
     */
    private getCommentInfo(reflection) {
        const options = this.application.options.getRawValues();
        if (!reflection.comment) {
            return;
        }

        let comment = this.getCommentData(reflection.comment);

        if (options[Constants.INCLUDE_TAGS_OPTION] && reflection.comment.tags) {
            comment[Constants.COMMENT] = Object.assign(this.getTagsComments(reflection.comment), comment[Constants.COMMENT]);            
        }

        if (options[Constants.INCLUDE_PARAMS_OPTION] && reflection.parameters) {
            comment[Constants.COMMENT] = Object.assign(this.getParamsComments(reflection), comment[Constants.COMMENT]);
        }



        /**
         * Raynor Chen @ Nov.15 2019
         * 
         * We ONLY support:
         * Comments for type alias itself 
         * Comments for the properties in type alias = type literal
         * 
         * ESPECIALLY NOT SUPPORT: 
         * The comments for the parameters in type alias => ()=>string
         * Tags in literal property comments. 
         */
        if (reflection.kind === ReflectionKind.TypeAlias && reflection.type){

            if (!comment[PROPERTIES_KEY]){
                comment[PROPERTIES_KEY] = {};
            }


            comment[PROPERTIES_KEY] ={
                ...comment[PROPERTIES_KEY],
                ...this.getTypeAliasPropertiesComments(reflection)[PROPERTIES_KEY]
            };
        }

        return comment;
    }

    /**
     * Returns all parameters per comment.
     * @param reflection 
     */
    private getParamsComments(reflection) {
        let params = {};
        params[Constants.PARAMS] = {};
        reflection.parameters.forEach(param => {
            if (!param.comment) {
                return;
            }

            const paramComment = this.getCommentData(param.comment);
            const paramCommentKeys = Object.keys(paramComment[Constants.COMMENT]);
            if (paramCommentKeys.length) {
                params[Constants.PARAMS][param.name] = paramComment;
            }
        });

        return Object.keys(params[Constants.PARAMS]).length ? params : {};
    }


    
    private getTypeAliasPropertiesComments(reflection: DeclarationReflection){
        let result = {};
        let properties = {}
        result[PROPERTIES_KEY] = properties;


        if (!GlobalFuncs.isSupportedTypeAliasReflection(reflection)){
            return result
        }

        let reflectionType = reflection.type as ReflectionType;

        reflectionType.declaration.children.forEach((c) => {
            if (c.hasComment()){
                properties[c.name] = this.getCommentData(c.comment);
            }
            
        });

        return result;
    }
    /**
     * Returns all tags per comment.
     * @param comment 
     */
    private getTagsComments(comment) {
        let tags = {};
        tags[Constants.TAGS] = {};
        comment.tags.forEach(tag => {
            let tagComment = this.getCommentData(tag);
            if (tag.tagName) {
                tags[Constants.TAGS][tag.tagName] = tagComment;
            }
        });

        return tags;
    }

    /**
     * Returns comment content.
     * @param obj 
     */
    private getCommentData(obj) {
        const comment = {};
        comment[Constants.COMMENT] = {};


        let splittedObj;
        if(obj.text && obj.text.trim().length) {
            splittedObj = this.parser.splitByCharacter(obj.text, '\n');
            comment[Constants.COMMENT][Constants.TEXT] = splittedObj;
        }

        if(obj.shortText && obj.shortText.trim().length) {
            splittedObj = this.parser.splitByCharacter(obj.shortText, '\n');
            comment[Constants.COMMENT][Constants.SHORT_TEXT] = splittedObj;
        }

        if(obj.tagName) {
            comment[Constants.COMMENT][Constants.TAG_NAME] = obj.tagName;
        }

        if(obj.returns && obj.returns.trim().length) {
            comment[Constants.COMMENT][Constants.RETURN] = obj.returns;
        }

        return comment;
    }

    /**
     * Builds a instance depending on the Object type.
     * @param objectType 
     * @param objectName 
     */
    private instanceBuilder(objectType, objectName): BaseFactory {
        switch(objectType) {
            case ReflectionKind.Enum:
                return new EnumFactory(objectName);
            case ReflectionKind.Interface:
                return new InterfaceFactory(objectName);
            case ReflectionKind.Function:
                return new FunctionFactory(objectName);
            case ReflectionKind.Class:
                return new ClassFactory(objectName);
            case ReflectionKind.Variable: 
                return new VariableFactory(objectName);
            case ReflectionKind.TypeAlias:
                return new TypeAliasFactory(objectName);
            case ReflectionKind.TypeLiteral:
                return new TypeLiteralFactory(objectName);
            default:
                null;
        }
    }
}