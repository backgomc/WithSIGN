package com.nonghyupit.broker.controller;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.nonghyupit.broker.utillity.LoginUtil;
import com.nonghyupit.broker.utillity.StringUtil;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SSOController {

    private static final Logger logger = LoggerFactory.getLogger(SSOController.class);

    @RequestMapping(value = "/sso/login", method = { RequestMethod.GET, RequestMethod.POST })
    public void login(HttpServletRequest request, HttpServletResponse response) {
        try {
            String ticket = StringUtil.isNull(request.getParameter("ticket"));
            logger.info("ticket=" + ticket);

            JSONObject resultJson = new JSONObject();
            if (!"".equals(ticket)) {
                resultJson.put("success", true);
                resultJson.put("sabun", LoginUtil.getId(ticket));
            } else {
                resultJson.put("success", false);
                resultJson.put("sabun", "");
            }

            response.setContentType("application/json; charset=UTF-8");
            response.getWriter().print(resultJson.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
