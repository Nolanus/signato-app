import 'zone.js/dist/zone-mix';
import 'reflect-metadata';
import 'polyfills';
import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { CKEditorModule } from 'ng2-ckeditor';
import { NgStringPipesModule } from 'angular-pipes';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';

import { AppRoutingModule } from './app-routing.module';

import { ModalDirective } from './directives/modal.directive';
import { ElectronService } from './providers/electron.service';
import { DataService } from './providers/data.service';
import { GlobalErrorHandler } from './handlers/global.errorhandler';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ModalDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    CKEditorModule,
    NgStringPipesModule
  ],
  providers: [
    ElectronService,
    DataService,
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
