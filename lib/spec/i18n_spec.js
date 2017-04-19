/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import { createAxEventBusMock } from 'laxar/laxar-widget-service-mocks';
import * as i18nPatterns from '../i18n';

describe( 'An i18n-Handler', () => {

   let languageTag;
   let localizeMock;
   let i18nMock;

   let context;
   let i18nHandler;

   let featureSuperFeatureSpy;
   let featureI18nLocaleSpy;
   let localeDefaultSpy;
   let localeMyLocaleSpy;
   let neverCalledSpy;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( () => {
      localizeMock = jasmine.createSpy( 'localize' ).and
         .callFake( i18nValue => i18nValue[ languageTag ] || i18nValue );
      i18nMock = {
         localizer: jasmine.createSpy( 'localizer' ).and.callFake( tag => {
            languageTag = tag;
            return localizeMock;
         } )
      };

      context = {
         eventBus: createAxEventBusMock( { nextTick: _ => Promise.resolve().then( _ ) } ),
         features: {
            superFeature: {
               locale: 'default'
            },
            i18n: {
               locale: 'myLocale'
            },
            noLocale: {

            }
         }
      };

      featureSuperFeatureSpy = jasmine.createSpy( 'featureSuperFeatureSpy' );
      featureI18nLocaleSpy = jasmine.createSpy( 'featureI18nLocaleSpy' );
      localeDefaultSpy = jasmine.createSpy( 'localeDefaultSpy' );
      localeMyLocaleSpy = jasmine.createSpy( 'localeMyLocaleSpy' );
      neverCalledSpy = jasmine.createSpy( 'neverCalledSpy' );

      i18nHandler = i18nPatterns.handlerFor( context, i18nMock )
         .contextLocaleFromFeature( 'superFeature', {
            onChange: featureSuperFeatureSpy
         } )
         .registerLocaleFromFeature( 'i18n.locale', {
            onChange: [ featureI18nLocaleSpy, featureI18nLocaleSpy ]
         } )
         .registerLocaleFromFeature( 'noLocale', {
            onChange: neverCalledSpy
         } )
         .registerLocale( context.features.superFeature.locale, {
            onChange: localeDefaultSpy
         } )
         .registerLocale( context.features.i18n.locale, {
            onChange: localeMyLocaleSpy
         } )
         .registerLocale( 'unused', {
            onChange: [ neverCalledSpy ]
         } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'subscribes to the according didChangeLocale events', () => {
      [ context.features.superFeature.locale, context.features.i18n.locale ].forEach( locale => {
         expect( context.eventBus.subscribe )
            .toHaveBeenCalledWith( `didChangeLocale.${locale}`, jasmine.any( Function ) );
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'allows to localize with a fallback value', () => {
      expect( i18nHandler.localizer( 'fallback' )( { 'unknown': 'hallo' } ) ).toEqual( 'fallback' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'only uses a fallback if necessary', () => {
      expect( i18nHandler.localizer( 'fallback' )( 'hallo' ) ).toEqual( 'hallo' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when locales change', () => {

      beforeEach( done => {
         Promise.all( [
            publishLocaleState( context.features.i18n.locale, 'en_US' ),
            publishLocaleState( context.features.superFeature.locale, 'de' )
         ] )
         .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sets the locale on the context accordingly', () => {
         expect( context.i18n.locale ).toEqual( context.features.superFeature.locale );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'changes the tag on the context accordingly', () => {
         expect( context.i18n.tags[ context.features.i18n.locale ] ).toEqual( 'en_US' );
         expect( context.i18n.tags[ context.features.superFeature.locale ] ).toEqual( 'de' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'calls the change handler of the locale if necessary', () => {
         expect( localeMyLocaleSpy ).toHaveBeenCalled();
         expect( localeMyLocaleSpy.calls.count() ).toEqual( 1 );
         expect( featureI18nLocaleSpy ).toHaveBeenCalled();
         expect( featureI18nLocaleSpy.calls.count() ).toEqual( 2 );
         expect( featureI18nLocaleSpy.calls.mostRecent().args[ 0 ].locale ).toEqual( 'myLocale' );
         expect( featureI18nLocaleSpy.calls.mostRecent().args[ 0 ].languageTag ).toEqual( 'en_US' );

         expect( featureSuperFeatureSpy ).toHaveBeenCalled();
         expect( localeDefaultSpy ).toHaveBeenCalled();
         expect( localeDefaultSpy.calls.mostRecent().args[ 0 ].locale ).toEqual( 'default' );
         expect( localeDefaultSpy.calls.mostRecent().args[ 0 ].languageTag ).toEqual( 'de' );

         expect( neverCalledSpy ).not.toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'updates its provided localizer', done => {
         const i18nHallo = { 'en_US': 'Hello', 'de': 'Guten Tag' };
         expect( i18nHandler.localizer()( i18nHallo ) ).toEqual( 'Guten Tag' );
         expect( i18nHandler.localizer()( 'xyz' ) ).toEqual( 'xyz' );

         publishLocaleState( context.features.superFeature.locale, 'en_US' )
            .then( () => {
               expect( i18nHandler.localizer()( i18nHallo ) ).toEqual( 'Hello' );
               expect( i18nMock.localizer ).toHaveBeenCalledWith( 'en_US', undefined );
            } )
            .then( done, done.fail );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function publishLocaleState( locale, languageTag ) {
      return context.eventBus.publish( `didChangeLocale.${locale}`, { locale, languageTag } );
   }

} );
