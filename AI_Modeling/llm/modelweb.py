import re
import sys
import json
import time
import openai
# from dotenv import load_dotenv
from flask import Flask, request, render_template, redirect, url_for, jsonify

# load_dotenv()
sessions = {}
stop_tokens = ['GET_NEW_ACTIVITIES:']
finish_tokens = ['END_SESSION:', 'STATUS_FINISH']
track_tokens_arr = stop_tokens + finish_tokens

system_msg = """I want you to give me advice on how to better distribute my time more effectively to achieve my goal in turn based on a list of activities tracked from my computer. You must always follow the following format.

GET_MY_GOALS: You will get from me a description of my next goal.
GET_ACTIVITIES: You will get from me a list of the latests activities executed on my computer.
GIVE_REFLECTION: You will create a plan to achieve the goal.
GIVE_SCHEDULE: You will create a schedule for the next three minutes. The schedule will be diplayed in a HTML table format. The table will contan the following fields Start_Time, End_Time, and Activity.
GET_NEW_ACTIVITIES: You will get from me the activities that I executed after your suggestions.
GIVE_DECISION: You must only respond one of these two options; STATUS_RETURN (and then jump to GIVE_REFLECTION) or STATUS_FINISH (and then jump to END_SESSION).
... (this GIVE_REFLECTION/GIVE_SCHEDULE/GET_NEW_ACTIVITIES/GIVE_DECISION can repeat N times)
END_SESSION: You will finish once you detect progress towards the goal.

Begin!
"""

# GIVE_SCHEDULE: Create a structured plan of activities in JSON format (only display the JSON string as output) for the next hour of today. The JSON output must be an array that contains schedule objects. Each schedule object contains the fields Start_Time, End_Time, and Activity. No 
# GIVE_SCHEDULE: Create a structured plan of activities as a table. table should have following fields Start_Time, End_Time, and Activity.Please give a shedule for each rows for every 5 minutes.Please don't give unncessary elements and sentences.Need only the table.
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('form.html')

@app.route('/submit', methods=['POST'])
def submit():
  session_id = request.form['session_id']
  goal = request.form['goal']
  activities = request.form['activities']
  output = endpoint(session_id, goal, activities)
  session_id = output['session_id']
  # return jsonify(session_id=session_id, goal=goal, activities=activities)
  return jsonify(output)

@app.route('/test', methods=['GET', 'POST'])
def test():
  session_id, goal, activities = None, None, None
  if request.method == 'POST':
    session_id = request.form['session_id']
    goal = request.form['goal']
    activities = request.form['activities']
  return render_template('test.html', session_id=session_id, goal=goal, activities=activities)

def get_session():
  return create_session()

def create_session():
  session_id = str(time.time())
  session = sessions[session_id] = {}
  session['messages'] = []
  session['activities'] = []
  session['initial'] = True
  session['finished'] = False
  return session_id

def finish_process(session_id):
  global sessions
  session = sessions[session_id]
  if session['finished']:
    return True
  if session['initial']:
    return False
  return False

def chat_completion(session_id, query, stop_tokens, track_tokens_arr):
  global sessions
  session = sessions[session_id]
  print('')
  found_token = False
  max_length = 0
  for token in track_tokens_arr:
    if len(token) > max_length:
      max_length = len(token)

  # session['messages'].append({"role": "user", "content": query})  
  print(session['messages'])
  response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo-16k",
    messages=session['messages'],
    stream=True
  )

  reply = ''
  for stream_resp in response:
    if 'content' in stream_resp["choices"][0]['delta']:
      token = stream_resp["choices"][0]["delta"]["content"]
      reply += token
      window = reply[-1*(max_length+1):]
      # print(token)
      sys.stdout.write(token)
      for finish_token in finish_tokens:
        if finish_token in window:
          session['finished'] = True
      for stop_token in stop_tokens:
        if stop_token in window:
          found_token = True
          response.close()
          break

  # reply = response["choices"][0]["message"]["content"]
  session['last_reply'] = reply
  return reply

def parse_text(text):
  sections = re.split(r'\n(?=[A-Z_]+:)', text)
  result = {}
  for section in sections:
    if ':' in section:
      title, content = section.split(':', 1)
      result[title.strip()] = content.strip()
    else:
      result['NO_SECTION'] = section.strip()
  return result

def enforce_next(session_id, next_step):
  global sessions
  session = sessions[session_id]
  next_action = f"\n{next_step} "
  query = next_action
  session['messages'].append({"role": "user", "content": query})
  reply = chat_completion(session_id, query, stop_tokens, track_tokens_arr)
  session['messages'].append({"role": "assistant", "content": reply})
  reply = next_action + reply
  sections = parse_text(reply)
  return sections

def process_next(session_id, query, next_step, enforce=False):
  global sessions
  session = sessions[session_id]
  print(next_step)
  reply = chat_completion(session_id, query, stop_tokens, track_tokens_arr)
  session['messages'].append({"role": "assistant", "content": reply})
  reply = next_action + reply
  sections = parse_text(reply)
  if enforce and next_step not in reply:
    sections_enf = enfonce_next(session_id, next_step)
    for section in sections_enf:
      sections[section] = sections_enf[section]
  return sections

def process(session_id):
  global sessions
  session = sessions[session_id]
  result = {}
  if session['initial']:
    session['initial'] = False
    sections = process_input(session_id, {'GET_MY_GOALS:': session['goal'], 'GET_ACTIVITIES:': session['activities'][-1]}, {'GIVE_REFLECTION:':''}, enforce='GIVE_REFLECTION:')
    for section in sections:
      result[section] = sections[section]
  else:
    sections = process_input(session_id, {'GET_NEW_ACTIVITIES:': session['activities'][-1]}, {'GIVE_DECISION:':'STATE_'})
    for section in sections:
      result[section] = sections[section]
    sections = loop_or_finish(session_id, 'GIVE_REFLECTION:', 'END_SESSION:', 'STATUS_RETURN', 'STATUS_FINISH')
    for section in sections:
      result[section] = sections[section]
  return result

def process_input(session_id, input_dict, output_dict, enforce=False):
  global sessions
  session = sessions[session_id]
  query = ''
  for key in input_dict:
    query += f'\n{key} {input_dict[key]}'
  output_state = ''
  for key in output_dict:
    output_state = key
    query += f'\n{key} {output_dict[key]}'
  session['messages'].append({"role": "user", "content": query})
  print(output_state)
  reply = chat_completion(session_id, query, stop_tokens, track_tokens_arr)
  session['messages'].append({"role": "assistant", "content": reply})
  reply = f'{output_state} ' + reply
  sections = parse_text(reply)
  if enforce and enforce not in reply:
    sections_enf = enforce_next(session_id, enforce)
    for section in sections_enf:
      sections[section] = sections_enf[section]
  return sections

def loop_or_finish(session_id, loop_state, finish_state, loop_token, finish_token):
  global sessions
  session = sessions[session_id]
  sections = {}
  if loop_token in session['last_reply'] and loop_state not in session['last_reply']:
    print(loop_state)
    sections = enforce_next(session_id, loop_state)
  elif finish_token in session['last_reply'] and finish_state not in session['last_reply']:
    print(finish_state)
    sections = enforce_next(session_id, finish_state)
  return sections

def run(session_id, activities):
  global sessions
  session = sessions[session_id]
  if not finish_process(session_id):
    session['activities'].append(activities)
    output = process(session_id)
    output['session_id'] = session_id
    output['status'] = 'ACTIVE'
    return output
  else:
    output = {}
    output['session_id'] = session_id
    output['status'] = 'FINISHED'
    return output

def init(goal):
  global sessions
  session_id = get_session()
  session = sessions[session_id]
  session['messages'].append({"role": "system", "content": system_msg})

  # goal = "I want to learn how to create a date picker on HTML and javascript that helps me to filter an HTML table."
  session['goal'] = goal
  return session_id

def endpoint(session_id, goal, activities):
  if session_id:
    return run(session_id, activities)
  else:
    session_id = init(goal)
    return run(session_id, activities)

# if __name__ == '__main__':
#     app.run(debug=True)
