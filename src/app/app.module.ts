import 'zone.js/dist/zone-mix';
import 'reflect-metadata';
import 'polyfills';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { CKEditorModule } from 'ng2-ckeditor';
import { NgStringPipesModule } from 'angular-pipes';
import { NguUtilityModule } from 'ngu-utility/ngu-utility.module';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';

import { AppRoutingModule } from './app-routing.module';

import { ModalDirective } from './directives/modal.directive';
import { ElectronService } from './providers/electron.service';
import { DataService } from './providers/data.service';

@NgModule({
	declarations: [
		AppComponent,
		HomeComponent,
		ModalDirective
	],
	imports: [
		BrowserModule,
		FormsModule,
		HttpModule,
		AppRoutingModule,
		CKEditorModule,
		NgStringPipesModule,
		NguUtilityModule
	],
	providers: [ElectronService, DataService],
	bootstrap: [AppComponent]
})
export class AppModule {
}
