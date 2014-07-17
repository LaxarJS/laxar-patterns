/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../i18n',
   'laxar'
], function( i18nPatterns, ax ) {
   'use strict';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An i18n-Handler', function() {

      var scope;
      var i18nHandler;

      var featureSuperFeatureSpy;
      var featureI18nLocaleSpy;
      var localeDefaultSpy;
      var localeMyLocaleSpy;
      var neverCalledSpy;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( function() {
         scope = {
            eventBus: ax.testing.portalMocks.mockEventBus(),
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

         i18nHandler = i18nPatterns.handlerFor( scope )
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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to the according didChangeLocale events', function() {
         [ scope.features.superFeature.locale, scope.features.i18n.locale ].forEach( function( locale ) {
            expect( scope.eventBus.subscribe )
               .toHaveBeenCalledWith( 'didChangeLocale.' + locale, jasmine.any( Function ) );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to localize with a fallback value', function() {
         expect( i18nHandler.localizer( 'fallback' )( { 'unknown': 'hallo' } ) ).toEqual( 'fallback' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'only uses a fallback if necessary', function() {
         expect( i18nHandler.localizer( 'fallback' )( 'hallo' ) ).toEqual( 'hallo' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when locales change', function() {

         beforeEach( function() {
            publishLocaleState( scope.features.i18n.locale, 'en_US' );
            publishLocaleState( scope.features.superFeature.locale, 'de' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sets the locale on the scope accordingly', function() {
            expect( scope.i18n.locale ).toEqual( scope.features.superFeature.locale );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'changes the tag on the scope accordingly', function() {
            expect( scope.i18n.tags[ scope.features.i18n.locale ] ).toEqual( 'en_US' );
            expect( scope.i18n.tags[ scope.features.superFeature.locale ] ).toEqual( 'de' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls the change handler of the locale if necessary', function() {

            expect( localeMyLocaleSpy ).toHaveBeenCalled();
            expect( localeMyLocaleSpy.callCount ).toEqual( 1 );
            expect( featureI18nLocaleSpy ).toHaveBeenCalled();
            expect( featureI18nLocaleSpy.callCount ).toEqual( 2 );
            expect( featureI18nLocaleSpy.mostRecentCall.args[ 0 ].locale ).toEqual( 'myLocale' );
            expect( featureI18nLocaleSpy.mostRecentCall.args[ 0 ].languageTag ).toEqual( 'en_US' );

            expect( featureSuperFeatureSpy ).toHaveBeenCalled();
            expect( localeDefaultSpy ).toHaveBeenCalled();
            expect( localeDefaultSpy.mostRecentCall.args[ 0 ].locale ).toEqual( 'default' );
            expect( localeDefaultSpy.mostRecentCall.args[ 0 ].languageTag ).toEqual( 'de' );

            expect( neverCalledSpy ).not.toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'updates its provided localizer', function() {
            var i18nHallo = { 'en_US': 'Hello', 'de': 'Guten Tag' };
            expect( i18nHandler.localizer()( i18nHallo ) ).toEqual( 'Guten Tag' );
            expect( i18nHandler.localizer()( 'xyz' ) ).toEqual( 'xyz' );
            publishLocaleState( scope.features.superFeature.locale, 'en_US' );
            expect( i18nHandler.localizer()( i18nHallo ) ).toEqual( 'Hello' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      function publishLocaleState( locale, languageTag ) {
         scope.eventBus.publish( 'didChangeLocale.' + locale, {
            locale: locale,
            languageTag: languageTag
         } );
         jasmine.Clock.tick( 0 );
      }

   } );

} );