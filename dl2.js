videojs.registerPlugin('dl', function () {
    // Create variables and new div, anchor and image for download icon
    var brightcovePlayer = this,
        videoName,
        totalRenditions,
        mp4Ara = [],
        highestQuality,
        spacer,
        newElement = document.createElement('div'),
        newImage = document.createElement('img');

    var overlay = document.createElement("div");
    overlay.innerHTML = '<p>Preparing to download video...</p>';
    overlay.id = 'dlIsPreparing';
    overlay.setAttribute("style", "    position: absolute;\n" +
        "    top: 50%;\n" +
        "    left: 50%;\n" +
        "    transform: translate3d(-50%,-50%,0);\n" +
        "    width: 240px;\n" +
        "    border: 1px solid #757575;\n" +
        "    border-radius: 4px;\n" +
        "    background: rgba(0,0,0,0.3);\n" +
        "    padding: 20px;\n" +
        "    font-size: 1.5em;\n" +
        "    text-align: center;\n" +
        "    display: none;");

    brightcovePlayer.on('loadstart', function () {
        brightcovePlayer.el().append(overlay);
        //Reinitialize array of MP4 renditions in case used with playlist
        //This prevents the array having a cumulative list for all videos in playlist
        mp4Ara = [];

        // +++ Get video name and the MP4 renditions +++
        videoName = brightcovePlayer.mediainfo['name'];
        videoName = removeSpaces(videoName);
        rendtionsAra = brightcovePlayer.mediainfo.sources;
        totalRenditions = rendtionsAra.length;

        console.log("=========================");
        console.log("videoName: ", videoName);
        console.log("=========================");


        // +++ Loop over videos and extract only MP4 versions +++
        for (var i = 0; i < totalRenditions; i++) {
            if (rendtionsAra[i].container === "MP4" && rendtionsAra[i].hasOwnProperty('src')) {
                mp4Ara.push(rendtionsAra[i]);
            }
        }

        // +++ Sort the renditions from highest to lowest on size+++
        mp4Ara.sort(function (a, b) {
            return b.size - a.size;
        });

        // +++ Extract the highest rendition +++
        highestQuality = mp4Ara[0].src;

        // +++ Build the download image element +++
        newElement.id = 'downloadImage';
        newElement.className = 'vjs-control downloadStyle';
        newImage.setAttribute('src', 'https://solutions.brightcove.com/bcls/brightcove-player/download-video/file-download.png');
        newImage.style['cursor'] = 'pointer';

        // +++ On image click call the download function +++
        newImage.onclick = function () {
            // The download function forces download by the browsers
            // NOT opening the video in a new window/tab
            var x = new XMLHttpRequest();
            x.open("GET", highestQuality, true);
            x.responseType = 'blob';
            x.onload = function (e) {
                download(x.response, videoName, "video/mp4");
            };
            console.log("=========================");
            console.log("x.responseType: ", x.responseType);
            console.log("x.response: ", x.response);

            //Show overlay with info like: "Video is preparing to download "
            //deactivate dowload btn for certain period
            toggleDlInfo();
            x.send();
        };
        newElement.appendChild(newImage);

        // +++ Place the download image +++
        // Get a handle on the spacer element
        spacer = brightcovePlayer.controlBar.customControlSpacer.el();
        // Set the content of the spacer to be right justified
        spacer.setAttribute("style", "justify-content: flex-end;");
        // Place the new element in the spacer
        spacer.appendChild(newElement);
    });

    function removeSpaces(str) {
        str = str.replace(/\s/g, '');
        return str;
    }

    function toggleDlInfo() {
        overlay.style.display = "block";
        newElement.setAttribute("style", "pointer-events: none;");
        setTimeout(function () {
            newElement.setAttribute("style", "pointer-events: auto;");
            overlay.style.display = "none";
        }, 1500)
    }
});
//download.js v4.2, by dandavis; 2008-2016. [CCBY2] see http://danml.com/download.html for tests/usage
// v1 landed a FF+Chrome compat way of downloading strings to local un-named files, upgraded to use a hidden frame and optional mime
// v2 added named files via a[download], msSaveBlob, IE (10+) support, and window.URL support for larger+faster saves than dataURLs
// v3 added dataURL and Blob Input, bind-toggle arity, and legacy dataURL fallback was improved with force-download mime and base64 support. 3.1 improved safari handling.
// v4 adds AMD/UMD, commonJS, and plain browser support
// v4.1 adds url download capability via solo URL argument (same domain/CORS only)
// v4.2 adds semantic variable names, long (over 2MB) dataURL support, and hidden by default temp anchors
// https://github.com/rndme/download

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.download = factory();
    }
}(this, function () {

    return function download(data, strFileName, strMimeType) {
        console.log("===========================");
        console.log("data: ", data);
        console.log("strFileName: ", strFileName);
        console.log("strMimeType: ", strMimeType);

        alert("===========================");
        var self = window, // this script is only for browsers anyway...
            defaultMime = "application/octet-stream", // this default mime also triggers iframe downloads
            mimeType = strMimeType || defaultMime,
            payload = data,
            url = !strFileName && !strMimeType && payload,
            anchor = document.createElement("a"),
            toString = function (a) {
                return String(a);
            },
            myBlob = (self.Blob || self.MozBlob || self.WebKitBlob || toString),
            fileName = (strFileName + "." + strMimeType.split("/")[1]) || "download",
            blob,
            reader;
        myBlob = myBlob.call ? myBlob.bind(self) : Blob;

        if (String(this) === "true") { //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
            payload = [payload, mimeType];
            mimeType = payload[0];
            payload = payload[1];
        }


        if (url && url.length < 2048) { // if no filename and no mime, assume a url was passed as the only argument
            fileName = url.split("/").pop().split("?")[0];
            anchor.href = url; // assign href prop to temp anchor
            if (anchor.href.indexOf(url) !== -1) { // if the browser determines that it's a potentially valid url path:
                var ajax = new XMLHttpRequest();
                ajax.open("GET", url, true);
                ajax.responseType = 'blob';
                console.log("===========================");
                console.log("e.target: ", e.target);
                alert("===========================");
                ajax.onload = function (e) {
                    download(e.target.response, fileName, defaultMime);
                };
                setTimeout(function () {
                    ajax.send();
                }, 0); // allows setting custom ajax headers using the return:
                return ajax;
            } // end if valid url?
        } // end if url?


        //go ahead and download dataURLs right away
        if (/^data\:[\w+\-]+\/[\w+\-]+[,;]/.test(payload)) {

            if (payload.length > (1024 * 1024 * 1.999) && myBlob !== toString) {
                payload = dataUrlToBlob(payload);
                alert("payload: ", payload);
                mimeType = payload.type || defaultMime;
            } else {

                console.log("payload: ", payload);
                alert("navigator.msSaveBlob: ", navigator.msSaveBlob);

                return navigator.msSaveBlob ? // IE10 can't do a[download], only Blobs:
                    navigator.msSaveBlob(dataUrlToBlob(payload), fileName) :
                    saver(payload); // everyone else can save dataURLs un-processed
            }

        } //end if dataURL passed?

        blob = payload instanceof myBlob ?
            payload :
            new myBlob([payload], {
                type: mimeType
            });


        function dataUrlToBlob(strUrl) {
            alert(strUrl);

            var parts = strUrl.split(/[:;,]/),
                type = parts[1],
                decoder = parts[2] == "base64" ? atob : decodeURIComponent,
                binData = decoder(parts.pop()),
                mx = binData.length,
                i = 0,
                uiArr = new Uint8Array(mx);

            for (i; i < mx; ++i) uiArr[i] = binData.charCodeAt(i);

            return new myBlob([uiArr], {
                type: type
            });
        }

        function saver(url, winMode) {
            alert(url);
            if ('download' in anchor) { //html5 A[download]
                anchor.href = url;
                anchor.setAttribute("download", fileName);
                anchor.className = "download-js-link";
                anchor.innerHTML = "downloading...";
                anchor.style.display = "none";
                document.body.appendChild(anchor);
                setTimeout(function () {
                    anchor.click();
                    document.body.removeChild(anchor);
                    if (winMode === true) {
                        setTimeout(function () {
                            self.URL.revokeObjectURL(anchor.href);
                        }, 250);
                    }
                }, 66);
                return true;
            }

            // handle non-a[download] safari as best we can:
            if (/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent)) {
                url = url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
                if (!window.open(url)) { // popup blocked, offer direct download:
                    if (confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")) {
                        location.href = url;
                    }
                }
                return true;
            }

            //do iframe dataURL download (old ch+FF):
            var f = document.createElement("iframe");
            document.body.appendChild(f);

            if (!winMode) { // force a mime that will download:
                url = "data:" + url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
            }
            f.src = url;
            setTimeout(function () {
                document.body.removeChild(f);
            }, 333);

        } //end saver


        if (navigator.msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
            return navigator.msSaveBlob(blob, fileName);
        }

        if (self.URL) { // simple fast and modern way using Blob and URL:
            saver(self.URL.createObjectURL(blob), true);
        } else {
            // handle non-Blob()+non-URL browsers:
            if (typeof blob === "string" || blob.constructor === toString) {
                try {
                    return saver("data:" + mimeType + ";base64," + self.btoa(blob));
                } catch (y) {
                    return saver("data:" + mimeType + "," + encodeURIComponent(blob));
                }
            }

            // Blob but not URL support:
            reader = new FileReader();
            reader.onload = function (e) {
                saver(this.result);
            };
            reader.readAsDataURL(blob);
        }
        return true;
    }; /* end download() */
}));