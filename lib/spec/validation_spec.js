/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../validation'
], function( validation ) {
   'use strict';

   describe( 'A validation pattern library', function() {

      var htmlMessages;
      var messagesWithLevel;
      var resource;

      beforeEach( function() {
         htmlMessages = [ {
            en: 'Something happened.'
         }, {
            en: 'Believe me!'
         } ];
         messagesWithLevel = [
            {
               htmlMessage: {
                  en: 'Something happened.'
               },
               level: 'INFO'
            },
            {
               htmlMessage: {
                  en: 'Believe me!'
               },
               level: 'WARNING'
            }
         ];
         resource = 'testResource';
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a method to create validation success events', function() {

         it( 'creates an outcome with SUCCESS for a resource', function() {
            expect( validation.successEvent( resource ) )
               .toEqual( {
                  data: [],
                  resource: resource,
                  outcome: 'SUCCESS'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses the level given in the messages', function() {
            expect( validation.successEvent( resource, messagesWithLevel ) )
               .toEqual( {
                  data: messagesWithLevel,
                  resource: resource,
                  outcome: 'SUCCESS'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'adds a default level of ERROR to the messages', function() {
            expect( validation.successEvent( resource, htmlMessages ) )
               .toEqual( {
                  data: [
                     {
                        htmlMessage: htmlMessages[0],
                        level: 'ERROR'
                     },
                     {
                        htmlMessage: htmlMessages[1],
                        level: 'ERROR'
                     }
                  ],
                  resource: resource,
                  outcome: 'SUCCESS'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'supports messages as varargs (jira ATP-7234)', function() {
            expect( validation.successEvent( resource, messagesWithLevel[0], messagesWithLevel[1] ) )
               .toEqual( {
                  data: messagesWithLevel,
                  resource: resource,
                  outcome: 'SUCCESS'
               } );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a method to create validation error events', function() {

         it( 'creates an outcome with ERROR for a resource', function() {
            expect( validation.errorEvent( resource ) )
               .toEqual( {
                  data: [],
                  resource: resource,
                  outcome: 'ERROR'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses the level given in the messages', function() {
            expect( validation.errorEvent( resource, messagesWithLevel ) )
               .toEqual( {
                  data: messagesWithLevel,
                  resource: resource,
                  outcome: 'ERROR'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'adds a default level of ERROR to the messages', function() {
            expect( validation.errorEvent( resource, htmlMessages ) )
               .toEqual( {
                  data: [
                     {
                        htmlMessage: htmlMessages[0],
                        level: 'ERROR'
                     },
                     {
                        htmlMessage: htmlMessages[1],
                        level: 'ERROR'
                     }
                  ],
                  resource: resource,
                  outcome: 'ERROR'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'supports messages as varargs (jira ATP-7234)', function() {
            expect( validation.errorEvent( resource, messagesWithLevel[0], messagesWithLevel[1] ) )
               .toEqual( {
                  data: messagesWithLevel,
                  resource: resource,
                  outcome: 'ERROR'
               } );
         } );

      } );


   } );

} );