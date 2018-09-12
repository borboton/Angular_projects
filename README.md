###### …or create a new repository on the command line
´´´ Bash
echo "# backend" >> README.md
git init
git add README.md
git commit -m "first commit"
git remote add origin git@github.com:borboton/backend.git
git push -u origin master
´´´
###### …or push an existing repository from the command line

´´´ Bash
git remote add origin git@github.com:borboton/backend.git
git push -u origin master

´´´
###### …or import code from another repository
You can initialize this repository with code from a Subversion, Mercurial, or TFS project.


##### Angular_projects
###### Angular projects for educational purpuse.

´´´ Javascripts
npm install -g @angular/cli
Create a components
ng new webcli
´´´
´´´ Javascripts
ng generate component component/home  
ng g c component/home 
´´´

´´´ Javascripts
ng generate module component/rutas 
ng g m component/rutas 
´´´
´´´ Javascripts
start web at localhost:4200
ng serve 
ng build --prod 
´´´
##### Usage

ng help

Generating and serving an Angular project via a development server

´´´ Javascripts
ng new PROJECT-NAME
cd PROJECT-NAME
ng serve
´´´

Navigate to http://localhost:4200/. The app will automatically reload if you change any of the source files.
You can configure the default HTTP host and port used by the development server with two command-line options :

´´´ Javascripts
ng serve --host 0.0.0.0 --port 4201
´´´

Generating Components, Directives, Pipes and Services

You can use the ng generate (or just ng g) command to generate Angular components:

´´´ Javascripts
ng generate component my-new-component
ng g component my-new-component # using the alias 
´´´

components support relative path generation
if in the directory src/app/feature/ and you run

´´´ Javascripts
ng g component new-cmp
your component will be generated in src/app/feature/new-cmp
but if you were to run
´´´

´´´ Javascripts
ng g component ./newer-cmp
´´´

your component will be generated in src/app/newer-cmp
if in the directory src/app you can also run

ng g component feature/new-cmp

and your component will be generated in src/app/feature/new-cmp
You can find all possible blueprints in the table below:

´´´ Javascripts
Scaffold	Usage
Component	ng g component my-new-component
Directive	ng g directive my-new-directive
Pipe	    ng g pipe my-new-pipe
Service	    ng g service my-new-service
Class	    ng g class my-new-class
Guard	    ng g guard my-new-guard
Interface	ng g interface my-new-interface
Enum	    ng g enum my-new-enum
Module	    ng g module my-module
angular-cli will add reference to components, directives and pipes automatically in the app.module.ts. If you need to add this references to another custom module, follow this steps:
ng g module new-module to create a new module
call ng g component new-module/new-component
This should add the new component, directive or pipe reference to the new-module you've created
´´´
