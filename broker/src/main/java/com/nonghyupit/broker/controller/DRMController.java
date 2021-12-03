package com.nonghyupit.broker.controller;

import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import com.nonghyupit.broker.utillity.DocuUtil;
import com.nonghyupit.broker.utillity.StringUtil;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class DRMController {

    private static final Logger logger = LoggerFactory.getLogger(DRMController.class);

    @RequestMapping(value = "/drm/packaging", method = { RequestMethod.GET, RequestMethod.POST })
    public void packaging(@RequestBody Map<String, Object> parameter, HttpServletResponse response) {

        logger.info("parameter in packaging : " + parameter.toString());

        try {
            String filePath = StringUtil.isNull(parameter.get("filePath"));
            String fileName = StringUtil.isNull(parameter.get("fileName"));
            String target = StringUtil.isNull(parameter.get("target"));

            JSONObject resultJson = new JSONObject();
            resultJson.put("success", DocuUtil.packaging(filePath, fileName, target));

            response.setContentType("application/json; charset=UTF-8");
            response.getWriter().print(resultJson.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @RequestMapping(value = "/drm/unpackaging", method = { RequestMethod.GET, RequestMethod.POST })
    public void unpackaging(@RequestBody Map<String, Object> parameter, HttpServletResponse response) {

        logger.info("parameter in unpackaging : " + parameter.toString());

        try {
            String filePath = StringUtil.isNull(parameter.get("filePath"));
            String fileName = StringUtil.isNull(parameter.get("fileName"));
            String target = StringUtil.isNull(parameter.get("target"));

            JSONObject resultJson = new JSONObject();
            resultJson.put("success", DocuUtil.unpackaging(filePath, fileName, target));

            response.setContentType("application/json; charset=UTF-8");
            response.getWriter().print(resultJson.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
