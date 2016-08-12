/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import { create as createEventBusMock } from 'laxar/lib/testing/event_bus_mock';
import * as i18nPatterns from '../i18n';

describe( 'An i18n-Handler', () => {

   let languageTag;
   let localizeMock;
   let i18nMock;

   let scope;
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

      scope = {
         eventBus: createEventBusMock( { nextTick: _ => Promise.resolve().then( _ ) } ),
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

      i18nHandler = i18nPatterns.handlerFor( scope, i18nMock )
         .scopeLocaleFromFeature( 'superFeature', {
            onChange: featureSuperFeatureSpy
         } )
         .registerLocaleFromFeature( 'i18n.locale', {
            onChange: [ featureI18nLocaleSpy, featureI18nLocaleSpy ]
         } )
         .registerLocaleFromFeature( 'noLocale', {
            onChange: neverCalledSpy
         } )
         .registerLocale( scope.features.superFeature.locale, {
            onChange: localeDefaultSpy
         } )
         .registerLocale( scope.features.i18n.locale, {
            onChange: localeMyLocaleSpy
         } )
         .registerLocale( 'unused', {
            onChange: [ neverCalledSpy ]
         } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'subscribes to the according didChangeLocale events', () => {
      [ scope.features.superFeature.locale, scope.features.i18n.locale ].forEach( locale => {
         expect( scope.eventBus.subscribe )
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
            publishLocaleState( scope.features.i18n.locale, 'en_US' ),
            publishLocaleState( scope.features.superFeature.locale, 'de' )
         ] )
         .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sets the locale on the scope accordingly', () => {
         expect( scope.i18n.locale ).toEqual( scope.features.superFeature.locale );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'changes the tag on the scope accordingly', () => {
         expect( scope.i18n.tags[ scope.features.i18n.locale ] ).toEqual( 'en_US' );
         expect( scope.i18n.tags[ scope.features.superFeature.locale ] ).toEqual( 'de' );
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

         publishLocaleState( scope.features.superFeature.locale, 'en_US' )
            .then( () => {
               expect( i18nHandler.localizer()( i18nHallo ) ).toEqual( 'Hello' );
               expect( i18nMock.localizer ).toHaveBeenCalledWith( 'en_US', undefined );
            } )
            .then( done, done.fail );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function publishLocaleState( locale, languageTag ) {
      return scope.eventBus.publish( `didChangeLocale.${locale}`, { locale, languageTag } );
   }

} );
