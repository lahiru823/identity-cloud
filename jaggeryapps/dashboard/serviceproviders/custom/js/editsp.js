function drawSPDetails() {
    if (appdata != null) {
        $('#spName').val(appdata.applicationName);
        $('#oldSPName').val(appdata.applicationName);
        var spDescription = appdata.description;
        var sptype = CUSTOM_SP;
        var spProperties = appdata.spProperties;
        if(spProperties != null) {
            if (spProperties.constructor !== Array) {
                spProperties = [spProperties];
            }
            for (var i in spProperties) {
                var property = spProperties[i];
                if (property.name == WELLKNOWN_APPLICATION_TYPE && property.value != null && property.value.length > 0) {
                    sptype = property.value;
                }
            }
        }
        if (spDescription.indexOf(']') > -1) {
            spDescription = spDescription.split(']') [1];
        }
        $('#sp-description').val(spDescription);
        $('#spType').val(sptype);
        if (sptype == CUSTOM_SP) {
            $('#gw-config-section').show();
        } else {
            $('#skipgateway').prop('checked', true);
        }
        preDrawClaimConfig();
        var samlsp;
        if (appdata != null && appdata.inboundAuthenticationConfig != null && appdata.inboundAuthenticationConfig.inboundAuthenticationRequestConfigs != null) {
            if (appdata.inboundAuthenticationConfig.inboundAuthenticationRequestConfigs.constructor !== Array) {
                appdata.inboundAuthenticationConfig.inboundAuthenticationRequestConfigs = [appdata.inboundAuthenticationConfig.inboundAuthenticationRequestConfigs];
            }
            for (var i in appdata.inboundAuthenticationConfig.inboundAuthenticationRequestConfigs) {
                var inboundConfig = appdata.inboundAuthenticationConfig.inboundAuthenticationRequestConfigs[i];
                if (inboundConfig.inboundAuthType == PASSIVE_STS && inboundConfig.inboundAuthKey.length > 0) {
                    $('#passiveSTSRealm').val(inboundConfig.inboundAuthKey);
                    if (inboundConfig.properties != null && inboundConfig.properties.constructor !== Array) {
                        inboundConfig.properties = [inboundConfig.properties];
                    }
                    for (var i in inboundConfig.properties) {
                        var property = inboundConfig.properties[i];
                        if (property.name == PASSIVE_STS_REPLY) {
                            $('#passiveSTSWReply').val(property.value);
                            break;
                        }
                    }
                } else if (inboundConfig.inboundAuthType == SAML_SSO) {
                    if (inboundConfig.properties != null && inboundConfig.properties.constructor !== Array) {
                        inboundConfig.properties = [inboundConfig.properties];
                    }
                    for (var i in inboundConfig.properties) {
                        var property = inboundConfig.properties[i];
                        if (property.name == WELLKNOWN_APPLICATION_TYPE && property.value == sptype) {
                            samlsp = inboundConfig;
                            break;
                        }
                    }
                }
            }
        }
        preDrawSAMLConfigPage(samlsp);
        if (sptype == CUSTOM_SP) {
            preDrawOAuthConfigPage();
            $('#oauthPanel').show();
            $('#wsfedPanel').show();
        }
    }
}

function drawAppDetails(data) {
    //gw properties
    $('#skipgateway').prop('checked', (data.skipGateway == "true"));

    if ($('#skipgateway').is(':checked')) {
        $("#gw-config input").val("");
        $("#gw-config").hide();
        if ($("#enableIdPInitSSO").is(':checked')) {
            $('#store-app-url').val(getIDPInitiatedSSOURL(issuer));
        } else {
            $("#store-app-url-sec").show();
            $('#store-app-url').val(data.appUrL);
        }
    } else {
        $("#gw-config").show();
        $('#gw-app-context').val(data.context);
        $('#gw-app-url').val(data.appUrL);
        $('#store-app-url').val(data.appUrL);
    }

    //store properties
    $('#store-app-name').val(data.displayName);
    $('#store-app-thumbnail-url').val(data.thumbnailUrl);
    $('#store-app-banner-url').val(data.banner);


    if (data.visibleRoles.toString().trim() != "") {
        var existingRoles = data.visibleRoles.toString().split(",");
        for (var i = 0; i < existingRoles.length; i++) {
            var role = existingRoles[i];
            $("#store-app-visibility").val(role).trigger("change");
        }
    }


    //Set Id for existing apps, if it's new App id will be ""
    var id;
    if (data == null) {
        id = "";
    } else {
        id = data.id;
    }
    $('#app-id').val(id);




}

function preDrawUpdatePage(appName) {
    preDrawSPDetails(appName);
    preDrawAppDetails(appName);
}

function preDrawSPDetails(appName){
    $.ajax({
        url: "/" + ADMIN_PORTAL_NAME + "/serviceproviders/getsp/" + appName,
        type: "GET",
        data: "&cookie=" + cookie + "&user=" + userName + "&spName=" + appName,
        success: function (data) {
            var resp = $.parseJSON(data);

            if (resp.success == false) {
                if (typeof resp.reLogin != 'undefined' && resp.reLogin == true) {
                    window.top.location.href = window.location.protocol + '//' + serverUrl + '/' + ADMIN_PORTAL_NAME + '/logout.jag';
                } else {
                    if (resp.message != null && resp.message.length > 0) {
                        message({
                            content: resp.message, type: 'error', cbk: function () {
                            }
                        });
                    } else {
                        message({
                            content: 'Error occurred while loading values for the grid.',
                            type: 'error',
                            cbk: function () {
                            }
                        });
                    }
                }
            } else {
                appdata = resp.return;
                drawSPDetails();
            }
        },
        error: function (e) {
            message({
                content: 'Error occurred while loading values for the grid.', type: 'error', cbk: function () {
                }
            });
        }
    });
}

function preDrawAppDetails(appName){
    $.ajax({
               url: "/" + ADMIN_PORTAL_NAME + "/apps/getApp/" + appName,
               type: "GET",
               data: "&cookie=" + cookie + "&user=" + userName + "&spName=" + appName,
               contentType: "multipart/form-data",
               success: function (data) {
                   drawAppDetails(JSON.parse(data));
               },
               error: function (e) {
                   message({
                               content: 'Error occurred while loading values for the grid.',
                               type: 'error',
                               cbk: function () {
                               }
                           });
               }
           });
}

function updateSP() {
    $('#number_of_claimmappings').val(document.getElementById("claimMappingAddTable").rows.length);
    var element = "<div class=\"modal fade\" id=\"messageModal\">\n" +
        "  <div class=\"modal-dialog\">\n" +
        "    <div class=\"modal-content\">\n" +
        "      <div class=\"modal-header\">\n" +
        "        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n" +
        "        <h3 class=\"modal-title\">Modal title</h4>\n" +
        "      </div>\n" +
        "      <div class=\"modal-body\">\n" +
        "        <p>One fine body&hellip;</p>\n" +
        "      </div>\n" +
        "      <div class=\"modal-footer\">\n" +
        "      </div>\n" +
        "    </div>\n" +
        "  </div>\n" +
        "</div>";
    $("#message").append(element);
    validateSPName(false);
}

function updateCustomSP() {
//    var str = PROXY_CONTEXT_PATH + "/dashboard/serviceproviders/custom/controllers/custom/edit_finish.jag";
    var str = "/" + ADMIN_PORTAL_NAME + "/serviceproviders/custom/controllers/custom/edit_finish";

    var visibleRoles = null;
    var roles = $('#store-app-visibility').select2('data');
    for (var i = 0; i < roles.length; i++) {
        if (visibleRoles == null) {
            visibleRoles = roles[i].text;
        } else {
            visibleRoles = visibleRoles + "," + roles[i].text;
        }
    }

    var gatewayProperties = JSON.stringify({
                                               "skipGateway": $('#skipgateway').is(':checked'),
                                               "appContext": $('#gw-app-context').val(),
                                               "appUrl": $('#gw-app-url').val()
                                           });

    var storeProperties = JSON.stringify({
                                             "appDisplayName": $('#store-app-name').val(),
                                             "appStoreUrl": $('#store-app-url').val(),
                                             "tags": $('#store-app-tags').val(),
                                             "visibleRoles": visibleRoles,
                                             "id": $('#app-id').val()
                                         });

    var thumbnailUrl = $('#store-app-thumbnail-url').val();
    var thumbnailFile;
    if ($('#store-app-thumbnail').val() != "") {
        thumbnailFile = $('#store-app-thumbnail')[0].files[0];
    }

    var bannerUrl = $('#store-app-banner-url').val();
    var bannerFile;
    if ($('#store-app-banner').val() != "") {
        bannerFile = $('#store-app-banner')[0].files[0];
    }

    var formData = new FormData();

    formData.append('claim_dialect', $('#claim_dialect').val());
    formData.append('subject_claim_uri', $('#subject_claim_uri').val());
    formData.append('number_of_claimmappings', $('#number_of_claimmappings').val());
    formData.append('roleClaim', $('#roleClaim').val());

    formData.append('oldSPName', $('#oldSPName').val());
    formData.append('spName', $('#spName').val());
    formData.append('spType', $('#spType').val());
    formData.append('spDesc', $('#spType').val() + ']' + $('#sp-description').val());

    formData.append('hiddenFields',$('#hiddenFields').val());
    formData.append('issuer',$('#issuer').val());
    formData.append('hiddenIssuer',$('#hiddenIssuer').val());
    formData.append('assertionConsumerURLTxt',$('#assertionConsumerURLTxt').val());
    formData.append('assertionConsumerURLs',$('#assertionConsumerURLs').val());
    formData.append('defaultAssertionConsumerURL',$('#defaultAssertionConsumerURL').val());
    formData.append('nameIdFormat',$('#nameIdFormat').val());
    formData.append('alias',$('#alias').val());
    formData.append('signingAlgorithm',$('#signingAlgorithm').val());
    formData.append('digestAlgorithm',$('#digestAlgorithm').val());
    formData.append('enableDefaultAttributeProfileHidden',$('#enableDefaultAttributeProfileHidden').val());
    formData.append('audiencePropertyCounter',$('#audiencePropertyCounter').val());
    formData.append('audienceURLs',$('#audienceURLs').val());
    formData.append('recipientPropertyCounter',$('#recipientPropertyCounter').val());
    formData.append('receipientURLs',$('#receipientURLs').val());
    formData.append('idpSLOURLs',$('#idpSLOURLs').val());
    formData.append('attributeConsumingServiceIndex',$('#attributeConsumingServiceIndex').val());



    if ($('#isEditOauthSP').val() == "true") {
        formData.append('consumerID', $('#consumerID').val());
        formData.append('consumerSecret', $('#consumerSecret').val());
    }

    formData.append('passiveSTSRealm', $('#passiveSTSRealm').val());
    formData.append('passiveSTSWReply', $('#passiveSTSWReply').val());
    formData.append('profileConfiguration', 'default');
    formData.append('cookie', cookie);
    formData.append('user', userName);
    formData.append('gatewayProperties', gatewayProperties);
    formData.append('storeProperties', storeProperties);
    formData.append('thumbnailFile', thumbnailFile);
    formData.append('thumbnailUrl', thumbnailUrl);
    formData.append('bannerFile', bannerFile);
    formData.append('bannerUrl', bannerUrl);
    
    $.ajax({
        url: str,
        type: "POST",
        contentType:false,
               processData: false,
               data: formData
    })
        .done(function (data) {
            window.location.href = "/" + ADMIN_PORTAL_NAME + "/serviceproviders";
        })
        .fail(function () {
            message({
                content: 'Error while updating Profile', type: 'error', cbk: function () {
                }
            });

        })
        .always(function () {
            console.log('completed');
        });
}

function validateSPName() {
    var spName = $("input[id='spName']").val();
    if (spName.length == 0) {
        alert('Error occured. PLease provide the message box properly. Dev Issue');
        message({
            content: 'Please provide Service Provider ID', type: 'error', cbk: function () {
            }
        });
        return false;
    } else {
        updateCustomSP();

    }
}

function getRequestParameter(param) {
    var vars = {};
    window.location.href.replace( location.hash, '' ).replace(
        /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
        function( m, key, value ) { // callback
            vars[key] = value !== undefined ? value : '';
        }
    );

    if ( param ) {
        return vars[param] ? vars[param] : null;
    }
    return vars;
}

function showSamlForm(){
    $('#samlConfigBtn').hide();
    $('#addServiceProvider').show();
}

/**
 * Claim Configuration related
 */
function showOauthForm() {
    $('#oauthAttrIndexForm').hide();
    $('#oauthConfigBtn').hide();
    $('#addAppForm').show();
}

function cancelOauthForm() {
    $('#addAppForm').hide();
    if ($('#isEditOauthSP').val() == 'true') {
        $('#oauthAttrIndexForm').show();
        $('#oauthConfigBtn').hide();
    } else {
        $('#oauthAttrIndexForm').hide();
        $('#oauthConfigBtn').show();

    }
}

function deleteOauthConfig() {
    var str = PROXY_CONTEXT_PATH + "/" + ADMIN_PORTAL_NAME + "/serviceproviders/custom/controllers/custom/oauthConfigHandler.jag";
    $.ajax({
        url: str,
        type: "POST",
        data: "&cookie=" + cookie + "&user=" + userName + "&spType=" + $('#spType').val() + "&appName=" + appdata.applicationName + "&clientID=" + $('#consumerID').val() + "&action=removeOauthConfig",
    })
        .done(function (data) {
            //reloadGrid();
            //message({content:'Successfully saved changes to the profile',type:'info', cbk:function(){} });
            preDrawUpdatePage(appdata.applicationName);
        })
        .fail(function () {
            message({
                content: 'Error while updating Profile', type: 'error', cbk: function () {
                }
            });

        })
        .always(function () {
            console.log('completed');
        });
}

function saveOauthConfig(){
    console.log('######################## saveOauthConfig');
//    var str = PROXY_CONTEXT_PATH + "/dashboard/serviceproviders/custom/controllers/custom/oauthConfigHandler";
    var str = "/" + ADMIN_PORTAL_NAME + "/serviceproviders/custom/controllers/custom/oauthConfigHandler";
    $.ajax({
        url: str,
        type: "POST",
        data: $("#addAppForm").serialize() + "&action=addOauthConfig" + "&spType=" + $('#spType').val() + "&appName=" + appdata.applicationName + "&isEditSP="+$('#isEditOauthSP').val()+"&cookie=" + cookie + "&user=" + userName,
    })
        .done(function (data) {
            //message({content:'Successfully saved changes to the profile',type:'info', cbk:function(){} });
            $('#addAppForm').hide();
            preDrawUpdatePage(appdata.applicationName);
        })
        .fail(function () {
            message({
                content: 'Error while updating Profile', type: 'error', cbk: function () {
                }
            });

        })
        .always(function () {
            console.log('completed');
        });

}

function uploadFile(file){
    $('#metadataFileName').val(file.value);

    var formData = new FormData();
    formData.append('file', $('input[type=file]')[0].files[0]);
    formData.append('cookie',cookie);
    formData.append('userName', userName);
    formData.append('clientAction','addSPConfigByMetadata');
    formData.append('spName',$('#oldSPName').val());
    formData.append('spType',$('#spType').val())


//    var str = PROXY_CONTEXT_PATH + "/dashboard/serviceproviders/custom/controllers/custom/samlSSOConfigClient";
    var str = "/" + ADMIN_PORTAL_NAME + "/serviceproviders/custom/controllers/custom/samlSSOConfigClient";
    $.ajax({
        url: str,
        type: 'POST',
        data: formData,
        success: function (data) {
            location.reload();
        },
        contentType: false,
        processData: false
    }).done(function (data) {

    })
        .fail(function () {
            message({
                content: 'Error while loading configurations from metadata', type: 'error', cbk: function () {
                }
            });

        })
        .always(function () {
            console.log('completed');
        });
}


$(document).ready(function () {
    $("#store-app-visibility").select2({
                                           data: getRoles(),
                                           multiple: true,
                                           allowClear: true,
                                           placeholder: 'Type in a user role'
                                       })
});

function getRoles() {
    var apiPath = "/dashboard/apps/getRoles";
    var roles;
    $.ajax({
               url: apiPath,
               type: 'GET',
               async: false,
               success: function (data) {
                   roles = JSON.parse(data);
               }
           });
    return roles
}
