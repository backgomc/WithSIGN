FROM gotenberg/gotenberg:7.5

USER root

# Copy Fonts
COPY ./fonts/* /usr/local/share/fonts/

# Setting & Install Language
# RUN apt-get update -qq &&\
#     DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends -t bookworm-backports libreoffice-l10n-ko &&\
#     sed -i '/ko_KR.UTF-8/s/^# //g' /etc/locale.gen &&\
#     locale-gen &&\
#     rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ENV LANG ko_KR.UTF-8
ENV LANGUAGE ko_KR:ko
ENV LC_ALL ko_KR.UTF-8

USER gotenberg