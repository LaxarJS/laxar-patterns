/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../json',
   'laxar/laxar_testing'
], function( json, ax ) {
   'use strict';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An json helper', function() {

      describe( 'with json pointer (rfc-6901) support', function() {

         var document;

         beforeEach( function() {
            // example from the spec, section 5
            document = {
               'foo': [ 'bar', 'baz' ],
               '': 0,
               'a/b': 1,
               'c%d': 2,
               'e^f': 3,
               'g|h': 4,
               'i\\j': 5,
               'k"l': 6,
               ' ': 7,
               'm~n': 8
            };
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'allows to resolve a pointer from an object', function() {
            // results from the spec, section 5
            expect( json.getPointer( document, '' ) ).toEqual( document );
            expect( json.getPointer( document, '/foo' ) ).toEqual( [ 'bar', 'baz' ] );
            expect( json.getPointer( document, '/foo/0' ) ).toEqual( 'bar' );
            expect( json.getPointer( document, '/' ) ).toEqual( 0 );
            expect( json.getPointer( document, '/a~1b' ) ).toEqual( 1 );
            expect( json.getPointer( document, '/c%d' ) ).toEqual( 2 );
            expect( json.getPointer( document, '/e^f' ) ).toEqual( 3 );
            expect( json.getPointer( document, '/g|h' ) ).toEqual( 4 );
            expect( json.getPointer( document, '/i\\j' ) ).toEqual( 5 );
            expect( json.getPointer( document, '/k"l' ) ).toEqual( 6 );
            expect( json.getPointer( document, '/ ' ) ).toEqual( 7 );
            expect( json.getPointer( document, '/m~0n' ) ).toEqual( 8 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'allows to manipulate an object using a pointer', function() {
            expect( json.setPointer( document, '/', 'A' ) ).toBe( document );
            expect( json.getPointer( document, '/' ) ).toEqual( 'A' );

            expect( json.setPointer( document, '/a~1b', 'B' ) ).toBe( document );
            expect( json.getPointer( document, '/a~1b' ) ).toEqual( 'B' );

            json.setPointer( document, '/foo/0', 'X' );
            expect( json.getPointer( document, '/foo' ) ).toEqual( [ 'X', 'baz' ] );

            json.setPointer( document, '/foo', 'Y' );
            expect( document.foo ).toEqual( 'Y' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'correctly handles an empty segment when manipulating documents', function() {
            var clone = ax.object.deepClone( document );
            clone[ '' ] = 'TEST';
            json.setPointer( document, '/', 'TEST' );
            expect( document ).toEqual( clone );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'allows to convert from an object path to a json pointer', function() {
            expect( json.pathToPointer( '' ) ).toEqual( '' );
            expect( json.pathToPointer( 'a.b.c' ) ).toEqual( '/a/b/c' );
            expect( json.pathToPointer( 'x/y.a/b' ) ).toEqual( '/x~1y/a~1b' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'allows to convert from a json pointer to a json path', function() {
            expect( json.pointerToPath( '' ) ).toEqual( '' );
            expect( json.pointerToPath( '/a/b/c' ) ).toEqual( 'a.b.c' );
            expect( json.pointerToPath( '/x~1y/a~1b' ) ).toEqual( 'x/y.a/b' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with json patch (rfc-6902) support', function() {

         var from, to, patches;

         beforeEach( function() {

            from = { a: [ '17', '18' ], b: [ 'x', 'y' ] };

            to = { a: [ '16', '18' ], b: [ 'x', 'y', 'z' ] };

            patches = [
               { op : 'add', path : '/b/2', value : 'z' },
               { op : 'replace', path : '/a/0', value : '16' }
            ];
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'allows to apply an existing patch sequence', function() {
            json.applyPatch( from, patches );
            expect( from ).toEqual( to );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'allows to create a patch sequence from existing objects', function() {
            expect( json.createPatch( from, to ) ).toEqual( patches );
         } );

      } );

   } );

} );
