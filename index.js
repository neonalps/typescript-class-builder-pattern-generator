import commandLineArgs from "command-line-args";

const optionDefinitions = [
  { name: 'name', alias: 'n', type: String },
  { name: 'field', alias: 'f', type: String, multiple: true }
];

const tab = (i = 1) => `   `.repeat(i);

const emptyLine = () => ``;

const capitalize = input => {
    return [
        `${input.charAt(0).toUpperCase()}`,
        `${input.substring(1)}`,
    ].join('');
};

const splitFieldDefinition = fieldDefinition => {
    const parts = fieldDefinition.split(":");
    
    if (!parts || parts.length !== 2) {
        return null;
    }
    
    return {
        name: parts[0],
        type: parts[1],
    };
};

const getClassHeader = (name) => {
    return [
        `export class ${name} {`,
    ];
};

const getClassFooter = () => {
    return [
        `}`,
    ];
};

const getClassFields = (fields) => {
    return fields.map(field => `${tab()}private _${field.name}!: ${field.type};`);
};

const getTypeAwareConstructorFieldAssignment = (field, prefix = "") => {
    const assignment = `${prefix}${field.name}`;

    if (field.type.indexOf('Set<') >= 0) {
        return `new Set(${assignment})`;
    }

    if (field.type.indexOf('Map<') >= 0) {
        return `new Map(${assignment})`;
    }

    return assignment;
};

const getClassConstructor = (builderName, fields) => {
    const fieldAssignments = fields.map(field => `${tab(2)}this._${field.name} = ${getTypeAwareConstructorFieldAssignment(field, 'builder.')};`);

    return [
        `${tab()}constructor(builder: ${builderName}) {`,
        ...fieldAssignments,
        `${tab()}}`,
    ];
};

const getClassGetters = (fields) => {
    return fields.map(field => {
        return [
            emptyLine(),
            `${tab()}public get ${field.name}(): ${field.type} {`,
            `${tab(2)}return ${getTypeAwareConstructorFieldAssignment(field, 'this._')};`,
            `${tab()}}`,
        ];
    }).flat();
};

const getBuilderGetter = (builderName) => {
    return [
        emptyLine(),
        `${tab()}public static get Builder(): ${builderName} {`,
        `${tab(2)}return new ${builderName}();`,
        `${tab()}}`,
    ];
};

const getBuilderHeader = (builderName) => {
    return [
        `class ${builderName} {`,
    ];
};

const getBuilderMethods = (builderName, fields) => {
    return fields.map(field => {
        return [
            emptyLine(),
            `${tab()}public with${capitalize(field.name)}(${field.name}: ${field.type}): ${builderName} {`,
            `${tab(2)}this._${field.name} = ${getTypeAwareConstructorFieldAssignment(field)};`,
            `${tab(2)}return this;`,
            `${tab()}}`,
        ];
    }).flat();
};

const getBuilderBuild = (className) => {
    return [
        emptyLine(),
        `${tab()}build(): ${className} {`,
        `${tab(2)}return new ${className}(this);`,
        `${tab()}}`,
    ];
};

const run = () => {
    const options = commandLineArgs(optionDefinitions);

    const className = options["name"];
    const fieldDefinitions = options["field"];
    const builderName = `${className}Builder`;

    const fields = fieldDefinitions
        .map(splitFieldDefinition)
        .filter(field => field !== null);

    const classContent = [
        ...getClassHeader(className), 
        ...getClassFields(fields),
        emptyLine(),
        ...getClassConstructor(builderName, fields),
        ...getClassGetters(fields),
        ...getBuilderGetter(builderName),
        ...getClassFooter(),
        emptyLine(),
        ...getBuilderHeader(builderName),
        ...getClassFields(fields),
        ...getBuilderMethods(builderName, fields),
        ...getClassGetters(fields),
        ...getBuilderBuild(className),
        ...getClassFooter(),
    ];

    console.log(classContent.join('\n'));
};

run();