"""Browser -> actual FastAPI routes -> isolated MongoDB-compatible test store."""
import os
import time
import urllib.request
from playwright.sync_api import sync_playwright, expect

for _ in range(60):
    try:
        urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=1)
        urllib.request.urlopen('http://127.0.0.1:4173', timeout=1)
        break
    except Exception:
        time.sleep(1)
else:
    raise RuntimeError('E2E services did not become ready')

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get("E2E_BROWSER_PATH"))
    try:
        for role in ['platform_admin', 'organization', 'principal_investigator', 'research_coordinator', 'participant']:
            context = browser.new_context()
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto('http://127.0.0.1:4173')
            page.get_by_label('Email Address', exact=True).fill(role + '@example.com')
            page.get_by_label('Password', exact=True).fill('E2E-password-998!')
            page.locator('form').get_by_role('button', name='Sign In', exact=True).click()
            expect(page.get_by_text('Welcome to TrialBridge', exact=True)).not_to_be_visible()
            expect(page.locator('main')).to_be_visible()
            page.reload()
            expect(page.locator('main')).to_be_visible()
            expect(page.get_by_text('Welcome to TrialBridge', exact=True)).not_to_be_visible()
            if role == 'participant':
                expect(page.get_by_text('Verified baseline appointment', exact=True)).to_be_visible()
                expect(page.get_by_text('Verified Research Study', exact=True)).to_be_visible()
                expect(page.get_by_text('Rahul Mehta', exact=True)).not_to_be_visible()
            # Reproduce the production HTML-vs-JSON fault after valid auth.
            page.route('**/api/studies/', lambda route: route.fulfill(status=200, content_type='text/html', body='<!doctype html><html>SPA</html>'))
            page.reload()
            expect(page.get_by_text('Some data could not be loaded. Please try again shortly.')).to_be_visible()
            expect(page.get_by_text('Something went wrong', exact=True)).not_to_be_visible()
            assert not errors, errors
            context.close()
            print('PASS role sign-in, reload, malformed data:', role)

        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()
        page.goto('http://127.0.0.1:4173')
        page.get_by_role('button', name='Participant Sign Up').click()
        page.get_by_label('Full Name').fill('E2E New Participant')
        page.get_by_label('Email Address', exact=True).fill('new.participant@example.com')
        page.get_by_label('Password', exact=True).fill('E2E-password-998!')
        page.get_by_label('Confirm Password', exact=True).fill('E2E-password-998!')
        page.get_by_role('button', name='Register as Participant').click()
        expect(page.get_by_text('Welcome to TrialBridge', exact=True)).not_to_be_visible()
        expect(page.locator('main')).to_be_visible()
        expect(page.get_by_role('heading', name='Not yet enrolled', exact=True)).to_be_visible()
        expect(page.get_by_text('Participant ID:', exact=False)).to_be_visible()
        expect(page.get_by_text('Some data could not be loaded. Please try again shortly.')).not_to_be_visible()
        context.close()
        print('PASS mobile participant registration, real unassigned profile, and automatic sign-in')

        context = browser.new_context()
        page = context.new_page()
        page.goto('http://127.0.0.1:4173')
        page.route('**/api/**', lambda route: route.fulfill(status=200, content_type='text/html', body='<!doctype html><html>SPA</html>'))
        page.get_by_label('Email Address', exact=True).fill('admin@example.com')
        page.get_by_label('Password', exact=True).fill('E2E-password-998!')
        page.locator('form').get_by_role('button', name='Sign In', exact=True).click()
        expect(page.get_by_text('The API is not connected. Please try again after the service is restored.')).to_be_visible()
        expect(page.get_by_text('Welcome to TrialBridge', exact=True)).to_be_visible()
        print('PASS unavailable API does not create a fake session')
    except Exception:
        page.screenshot(path='e2e-failure.png', full_page=True)
        raise
    finally:
        browser.close()
