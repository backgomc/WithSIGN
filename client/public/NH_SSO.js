//TODO: 태블릿 지원을 위해 구분 필요: Mozilla 는 ie11 도 포함되므로 다른 방법 필요함 
if (navigator.userAgent.indexOf('Chrome') > -1) {
// if (navigator.userAgent.indexOf('Chrome') > -1 || navigator.userAgent.indexOf('Mozilla') > -1) {
    // Chromium 오픈소스 프로젝트 기반으로 제작된 브라우저
} else {   
    // 그 외
    try {
        document.write('<OBJECT ID="NEXESS_API" CLASSID="CLSID:D4F62B67-8BA3-4A8D-94F6-777A015DB612" width=0 height=0></OBJECT>');
        var objShell = new ActiveXObject('WScript.Shell');
        var runProgram = 'msedge http://10.220.141.91:3001/?t='+encodeURIComponent(NEXESS_API.GetTicket());
        objShell.run(runProgram, 1, false);
    } catch(e) {
        alert('[인터넷 옵션]-[보안]-[신뢰할 수 있는 사이트]-[사용자 지정 수준] 선택 후\n\n스크립팅하기 안전하지 않는 것으로 표시된 ActiveX : 사용 선택\n\n신뢰할 수 있는 사이트에 WithSIGN(10.220.141.91) 추가 필수');
    }
}
