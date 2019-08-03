const path = require('path');
const exec = require('child_process').execSync;
const fs = require('fs');
 
const excute = () => {
    resolveVersion();
    console.info(exec('npm publish . --registry https://registry.npmjs.org', {cwd: `${path.join(__dirname, '../dist/')}`, stdio : 'pipe'}).toString());
}
 
const resolveVersion = () => {
    let packagePath = path.join(__dirname, '..', './package.json');
    let distPackagePath = path.join(__dirname, '..', './dist/package.json');
    let package = JSON.parse(fs.readFileSync(packagePath));
    package.version = getNewVer(package.version);
    fs.writeFileSync(packagePath, JSON.stringify(package, null, 4));
    fs.writeFileSync(distPackagePath, JSON.stringify(package, null, 4));
}
 
 
const getNewVer = (oldVersion) => {
    let temps = oldVersion.split('.');
    temps[2] = Number(temps[2]) + 1
    return temps.join(".");
}
 
excute();